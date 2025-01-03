import { getEmbeddings } from '@/utils/embeddings'
import { getMatchesFromEmbeddings } from '@/utils/pinecone'
import dayjs from "dayjs";
import prismadb from '../../lib/prismadb';
import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from 'next/server';
import { getMessageCreditCount } from '@/lib/messageCredits';
import { OpenAI } from "openai";

interface SearchResult {
  raw_case_num: string;
  case_title: string;
  case_date: string;
  case_court: string;
  case_neutral_cit: string;
  case_action_no: string;
  url: string;
}

interface SearchRequest {
  prefixFilters: string[];
  searchQuery: string;
  selectedMinDate: string;
  selectedMaxDate: string;
  sortOption: "Relevance" | "Recency";
  countryOption: "hk" | "uk";
}

async function validateUserAndCredits(userId: string | null) {
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Add timeout to currentUser call
  const userPromise = currentUser();
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("User validation timed out")), 5000)
  );

  try {
    const user = await Promise.race([userPromise, timeoutPromise]) as any;
    if (!user?.firstName || !user?.lastName || !user?.emailAddresses?.[0]?.emailAddress) {
      throw new Error("User information incomplete");
    }

    const creditsLeft = await getMessageCreditCount(userId);
    if (creditsLeft === false || typeof creditsLeft === 'number' && creditsLeft <= 0) {
      throw new Error("No more credits. Please upgrade or buy more credits.");
    }

    return {
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.emailAddresses[0].emailAddress,
    };
  } catch (error) {
    console.error("Validation error:", error);
    throw error;
  }
}

function parseSearchRequest(data: any): SearchRequest {
  if (!data.searchQuery || !data.selectedMinDate || !data.selectedMaxDate || !data.countryOption) {
    throw new Error("Missing required search parameters");
  }
  return data as SearchRequest;
}

async function createSearchRecord(searchData: SearchRequest, userId: string, userName: string, userEmail: string) {
  return await prismadb.search.create({
    data: {
      query: searchData.searchQuery,
      prefixFilters: JSON.stringify(searchData.prefixFilters),
      minDate: searchData.selectedMinDate,
      maxDate: searchData.selectedMaxDate,
      userId,
      userName,
      userEmail,
      countryOption: searchData.countryOption
    }
  });
}

function buildSearchFilters(minDateUnix: number, maxDateUnix: number, prefixFilters: string[], countryOption: string) {
  let filters: any = {
    "$and": [
      { "unix_timestamp": { "$gte": minDateUnix } },
      { "unix_timestamp": { "$lte": maxDateUnix } },
    ],
  };

  if (countryOption === "hk" && prefixFilters.length > 0) {
    filters["$and"].push({ "case_prefix": { "$in": prefixFilters } });
  } else if (prefixFilters.length > 0) {
    filters["$and"].push({ "db": { "$in": prefixFilters } });
  }

  return filters;
}

function convertToUrl(caseRef: string, countryOption: string) {
  if (countryOption === "hk") {
    const parts = caseRef.split('_');
    if (parts.length === 3) {
      const [year, court, caseNumber] = parts;
      return `https://www.hklii.hk/en/cases/${court.toLowerCase()}/${year}/${caseNumber}`;
    }
    return 'Invalid case reference format';
  } 
  return `https://www.bailii.org/uk/cases${caseRef}`;
}

async function evaluateRelevance(query: string, chunk: string): Promise<number> {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `You are a legal research assistant. Your task is to evaluate how relevant a text chunk is to a given query.
    
Query: "${query}"

Text chunk: "${chunk}"

Rate the relevance of this text chunk to the query on a scale of 0-10, where:
0 = Completely irrelevant
5 = Somewhat relevant
10 = Highly relevant, directly addresses the query

Only respond with a number between 0 and 10.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a legal research assistant that evaluates the relevance of text to queries. Only respond with a number between 0 and 10.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0,
      max_tokens: 10,
    });

    const score = parseFloat(response.choices[0].message.content || "0");
    return isNaN(score) ? 0 : Math.min(Math.max(score, 0), 10);
  } catch (err) {
    console.error("Error evaluating chunk:", err);
    return 0;
  }
}

async function performVectorSearch(searchQuery: string, countryOption: string, filters: any) {
  const embedding = await getEmbeddings(searchQuery);
  const matches = await getMatchesFromEmbeddings(embedding, 20, '', countryOption, filters);
  
  const rawMatchesWithScores = await Promise.all(
    matches.map(async match => {
      const nodeContent = JSON.parse(match.metadata._node_content);
      const chunk = nodeContent.text || "";
      
      const gptScore = await evaluateRelevance(searchQuery, chunk);

      return {
        metadata: JSON.stringify(match.metadata),
        score: match.score || 0,
        chunk: chunk,
        gptScore: gptScore,
        gptEvaluation: {
          score: gptScore
        }
      };
    })
  );

  const sortedMatches = rawMatchesWithScores.sort((a, b) => b.gptScore - a.gptScore);

  const seen = new Set();
  const dedupedMatches = sortedMatches.filter(match => {
    const metadata = JSON.parse(match.metadata);
    const caseRef = metadata.raw_case_num;
    if (seen.has(caseRef)) return false;
    seen.add(caseRef);
    return true;
  });

  return { matches, rawMatches: dedupedMatches };
}

function processSearchResults(matches: any[], countryOption: string): SearchResult[] {
  return matches.map((match) => {
    const { raw_case_num, cases_title, date, db, neutral_cit, cases_act, case_path = '' } = match.metadata;
    const caseRef = countryOption === "hk" ? raw_case_num : case_path;
    const url = convertToUrl(caseRef, countryOption);

    return {
      raw_case_num,
      case_title: Array.isArray(cases_title) ? cases_title[0] : cases_title,
      case_date: date,
      case_court: db,
      case_neutral_cit: neutral_cit,
      case_action_no: Array.isArray(cases_act) ? cases_act[0] : (cases_act === undefined ? "N/A" : cases_act),
      url
    };
  });
}

async function saveSearchResults(results: SearchResult[], searchId: string, userId: string, userName: string, userEmail: string, rawMatches: any[]) {
  await Promise.all(results.map((result, index) => {
    // Find corresponding raw match for this result
    const rawMatch = rawMatches.find(match => {
      const metadata = JSON.parse(match.metadata);
      return metadata.raw_case_num === result.raw_case_num;
    });

    return prismadb.searchResult.create({
      data: {
        caseName: result.case_title,
        caseNeutralCit: result.case_neutral_cit,
        caseActionNo: result.case_action_no,
        caseDate: dayjs(result.case_date).toISOString(),
        caseUrl: result.url,
        searchId,
        userId,
        userName,
        userEmail,
        gptScore: rawMatch?.gptScore || null,
        vectorScore: rawMatch?.score || null
      }
    });
  }));
}

function sortResults(results: SearchResult[], sortOption: string): SearchResult[] {
  if (sortOption === "Recency") {
    return [...results].sort((a, b) => 
      dayjs(b.case_date).diff(dayjs(a.case_date))
    );
  }
  return results;
}

export async function POST(req: Request) {
  try {
    // Read request body once
    const requestData = await req.json();

    // Step 1: Validate user and check credits
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const { userName, userEmail } = await validateUserAndCredits(userId);

    // Step 2: Parse and validate request
    const searchData = parseSearchRequest(requestData);

    // Step 3: Create search record
    const searchRecord = await createSearchRecord(searchData, userId, userName, userEmail);

    // Step 4: Build search filters
    const minDateUnix = dayjs(searchData.selectedMinDate).unix();
    const maxDateUnix = dayjs(searchData.selectedMaxDate).unix();
    const filters = buildSearchFilters(
      minDateUnix,
      maxDateUnix,
      searchData.prefixFilters,
      searchData.countryOption
    );

    // Step 5: Perform vector search
    const { matches, rawMatches } = await performVectorSearch(
      searchData.searchQuery,
      searchData.countryOption,
      filters
    );

    // Step 6: Process search results
    const results = processSearchResults(matches, searchData.countryOption);
    const sortedResults = sortResults(results, searchData.sortOption);

    // Step 7: Save search results
    await saveSearchResults(sortedResults, searchRecord.id, userId, userName, userEmail, rawMatches);

    return new Response(
      JSON.stringify({ searchId: searchRecord.id }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("API Error:", error);
    if (error instanceof Error && error.message === "No more credits. Please upgrade or buy more credits.") {
      return new NextResponse("Forbidden", { status: 403 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
  