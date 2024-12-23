import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { getRefinedQuery } from "@/utils/openai";
import { getEmbeddings } from "@/utils/embeddings";
import { getMatchesFromEmbeddings } from "@/utils/pinecone";

export async function GET(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const searchId = searchParams.get("searchId");

    if (!searchId) {
      return new NextResponse("Search ID is required", { status: 400 });
    }

    const searchRecord = await prismadb.search.findFirst({
      where: { id: searchId },
      include: { 
        rawMatches: {
          take: 20  // Reduced from 50 to 20
        } 
      }
    });

    if (!searchRecord) {
      return new NextResponse("Search record not found", { status: 404 });
    }

    // Get refined query results
    const refinedQuery = await getRefinedQuery(searchRecord.query);
    console.log('Refined query:', refinedQuery);

    const embedding = await getEmbeddings(refinedQuery);
    const refinedMatches = await getMatchesFromEmbeddings(
      embedding,
      20,  // Reduced from 50 to 20
      '',
      searchRecord.countryOption,
      {} // No filters for refined query to get broader results
    );

    // Process refined matches
    const processedRefinedMatches = refinedMatches.map(match => {
      const nodeContent = JSON.parse(match.metadata._node_content);
      return {
        metadata: JSON.stringify(match.metadata),
        score: match.score || 0,
        chunk: nodeContent.text || "",
      };
    });

    return NextResponse.json({
      ...searchRecord,
      rawMatches: searchRecord.rawMatches,
      refinedMatches: processedRefinedMatches,
      refinedQuery
    });

  } catch (error) {
    console.error("[RETRIEVAL_EVAL_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { matches, searchId } = body;

    if (!matches || !searchId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Store raw matches in the database
    const rawMatches = await prismadb.rawMatch.createMany({
      data: matches.map((match: any) => ({
        searchId,
        metadata: JSON.stringify(match.metadata),
        score: match.score,
        chunk: match.chunk || "",
      }))
    });

    return NextResponse.json(rawMatches);

  } catch (error) {
    console.error("[RETRIEVAL_EVAL_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 