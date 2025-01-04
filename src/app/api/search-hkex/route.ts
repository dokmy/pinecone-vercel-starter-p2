import { NextResponse } from "next/server";
import typesenseClient from "../../../lib/typesense";
import { auth, currentUser } from "@clerk/nextjs";
import prismadb from "../../lib/prismadb";
import { getMessageCreditCount, deductMessageCredit } from "@/lib/messageCredits";

interface TypesenseDocument {
  chunk_text: string;
  FILE_INFO: string;
  NEWS_ID: string;
  SHORT_TEXT: string;
  TOTAL_COUNT: number;
  DOD_WEB_PATH: string;
  STOCK_NAME: string;
  TITLE: string;
  FILE_TYPE: string;
  DATE_TIME: string;
  LONG_TEXT: string;
  STOCK_CODE: string;
  FILE_LINK: string;
  unix_timestamp: number;
  t1_code: string;
}

interface TypesenseSearchHit {
  document: TypesenseDocument;
  highlights: Array<{
    field: string;
    snippet: string;
  }>;
  text_match: number;
}

interface TypesenseSearchResponse {
  hits?: TypesenseSearchHit[];
  found: number;
  search_time_ms: number;
  facet_counts?: Array<{
    field_name: string;
    counts: Array<{
      value: string;
      count: number;
    }>;
  }>;
  grouped_hits?: Array<{
    hits: TypesenseSearchHit[];
  }>;
}

interface SearchRequestBody {
  query: string;
  page: number;
  t1Codes: string[];
  stockCodes?: string[];
  stockNames?: string[];
  dateRange?: {
    start: number;
    end: number;
  };
  sortBy: "relevancy" | "recency";
  viewMode: "consolidated" | "detailed";
}

export async function POST(req: Request) {
  // Declare userId outside try block
  const { userId } = auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    console.log("Starting HKEX search for user", userId);

    // Check message credits
    const creditsLeft = await getMessageCreditCount(userId);
    console.log("User has", creditsLeft, "credits remaining");

    if (creditsLeft === false || creditsLeft <= 0) {
      console.log("Search rejected - insufficient credits");
      return new NextResponse("No more credits. Please upgrade or buy more credits.", { status: 403 });
    }

    // Get user details
    const user = await currentUser();
    const userName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : null;
    const userEmail = user?.emailAddresses[0]?.emailAddress || null;

    const body = await req.json() as SearchRequestBody;
    console.log("API Route - Received search request with viewMode:", body.viewMode);

    const {
      query,
      page = 1,
      t1Codes = [],
      stockCodes = [],
      stockNames = [],
      dateRange,
      sortBy = "relevancy",
      viewMode = "consolidated",
    } = body;

    const perPage = 10;

    let filterBy: string[] = [];
    
    if (t1Codes.length > 0) {
      console.log("API Route - Received t1Codes:", t1Codes);
      const filter = `t1_code:=[${t1Codes.join(",")}]`;
      console.log("API Route - Constructed t1_code filter:", filter);
      filterBy.push(filter);
    }

    if (stockCodes.length > 0) {
      filterBy.push(`STOCK_CODE:=[${stockCodes.join(",")}]`);
    }

    if (stockNames.length > 0) {
      filterBy.push(`STOCK_NAME:=[${stockNames.join(",")}]`);
    }

    if (dateRange?.start && dateRange?.end) {
      filterBy.push(`unix_timestamp:>=${dateRange.start} && unix_timestamp:<=${dateRange.end}`);
    }

    console.log("API Route - Filter conditions:", filterBy);

    const searchParameters = {
      q: query,
      query_by: "chunk_text,TITLE,STOCK_NAME,STOCK_CODE",
      filter_by: filterBy.join(" && "),
      sort_by: sortBy === "recency" ? "unix_timestamp:desc" : "_text_match:desc",
      page,
      per_page: perPage,
      highlight_full_fields: "chunk_text,TITLE",
      highlight_start_tag: "<mark>",
      highlight_end_tag: "</mark>",
      highlight_affix_num_tokens: 8,
      facet_by: ["STOCK_CODE", "STOCK_NAME"],
      max_facet_values: 100,
      ...(viewMode === "consolidated" ? {
        group_by: "NEWS_ID",
        group_limit: 1
      } : {})
    };

    console.log("API Route - Final filterBy array:", filterBy);
    console.log("API Route - Final filter_by string:", searchParameters.filter_by);

    console.log("API Route - Search mode:", viewMode);
    console.log("API Route - Using grouping:", viewMode === "consolidated");

    const results = await typesenseClient
      .collections(process.env.COLLECTION_NAME!)
      .documents()
      .search(searchParameters);

    console.log("API Route - Raw results:", results);

    const transformedFacets = results.facet_counts?.reduce((acc, facet) => {
      acc[facet.field_name] = facet.counts;
      return acc;
    }, {} as Record<string, Array<{ value: string; count: number }>>);

    try {
      // Save search to database after successful search
      await prismadb.searchHKEX.create({
        data: {
          userId,
          userName,
          userEmail,
          query: body.query,
          t1Codes: body.t1Codes.length > 0 ? JSON.stringify(body.t1Codes) : null,
          stockCodes: body.stockCodes?.length ? JSON.stringify(body.stockCodes) : null,
          stockNames: body.stockNames?.length ? JSON.stringify(body.stockNames) : null,
          dateRange: body.dateRange ? JSON.stringify(body.dateRange) : null,
          sortBy: body.sortBy,
          viewMode: body.viewMode
        }
      });
      console.log("Search history saved");
    } catch (error) {
      console.error("Failed to save search history:", error);
      // Continue with the search even if saving history fails
    }

    // Deduct credit after successful search but before returning results
    await deductMessageCredit(userId);
    console.log("Search completed, credit deducted");

    if (viewMode === "consolidated") {
      const groupedHits = results.grouped_hits?.map(gh => gh.hits[0]) || [];
      return NextResponse.json({
        found: results.found,
        hits: groupedHits,
        facets: transformedFacets
      });
    }

    return NextResponse.json({
      found: results.found,
      hits: results.hits,
      facets: transformedFacets
    });

  } catch (error) {
    console.error("Search error:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}

// For auto-suggestions
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const prefix = searchParams.get("prefix");
  const field = searchParams.get("field");

  if (!prefix || !field) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const results = await typesenseClient
      .collections(process.env.COLLECTION_NAME!)
      .documents()
      .search({
        q: prefix,
        query_by: field as keyof TypesenseDocument,
        prefix: true,
        per_page: 5,
      }) as TypesenseSearchResponse;

    const suggestions = [...new Set(
      results.hits?.map(hit => hit.document[field as keyof TypesenseDocument]) || []
    )];
    
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Suggestion error:", error);
    return NextResponse.json(
      { error: "Failed to get suggestions" },
      { status: 500 }
    );
  }
} 