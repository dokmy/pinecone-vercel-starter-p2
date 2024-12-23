import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { getMatchesFromEmbeddings } from "@/utils/pinecone";

export async function POST(req: Request) {
  try {
    console.log("get-case-chunks: Starting request");
    
    const { userId } = auth();
    if (!userId) {
      console.log("get-case-chunks: Unauthorized request");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { caseRef, db } = body;
    console.log("get-case-chunks: Received request for case:", caseRef, "db:", db);

    if (!caseRef || !db) {
      console.log("get-case-chunks: Missing required fields");
      return new NextResponse("Missing case reference or database", { status: 400 });
    }

    // Create a filter for Pinecone to get all chunks from this case
    const filter = {
      "$and": [
        { "raw_case_num": caseRef },
        { "db": db }
      ]
    };
    console.log("get-case-chunks: Created Pinecone filter:", JSON.stringify(filter));

    // Create a dummy vector of zeros with dimension 1536
    const dummyVector = new Array(1536).fill(0);
    console.log("get-case-chunks: Created dummy vector of length:", dummyVector.length);

    // Get all chunks for this case (using a large topK to get all chunks)
    console.log("get-case-chunks: Calling Pinecone...");
    const matches = await getMatchesFromEmbeddings(
      dummyVector,
      1000, // Large number to get all chunks
      '',
      'hk', // Assuming HK for now
      filter
    );
    console.log("get-case-chunks: Received matches from Pinecone, count:", matches.length);

    // Process the matches to get the chunks
    console.log("get-case-chunks: Processing matches...");
    const processedMatches = matches.map(match => {
      const nodeContent = JSON.parse(match.metadata._node_content);
      return {
        chunk: nodeContent.text || "",
        metadata: match.metadata
      };
    });
    console.log("get-case-chunks: Processed matches count:", processedMatches.length);

    return NextResponse.json(processedMatches);

  } catch (error) {
    console.error("get-case-chunks: Error processing request:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 