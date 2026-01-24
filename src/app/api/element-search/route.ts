import { NextResponse } from "next/server";
import { getEmbeddings } from "@/utils/embeddings";
import { getMatchesFromEmbeddings } from "@/utils/pinecone";
import dayjs from "dayjs";

interface ElementSearchRequest {
  element1: string;
  element2: string;
  element3: string;
}

interface CaseChunk {
  metadata: any;
  score: number;
  chunk: string;
}

interface UniqueCase {
  raw_case_num: string;
  caseName: string;
  caseNeutralCit: string;
  caseActionNo: string;
  caseDate: string;
  caseUrl: string;
  combinedText: string;
  vectorScore: number;
}

interface ElementEvaluation {
  element1Match: "FULL_MATCH" | "PARTIAL_MATCH" | "NO_MATCH";
  element1Explanation: string;
  element1Quote?: string;
  element2Match: "FULL_MATCH" | "PARTIAL_MATCH" | "NO_MATCH";
  element2Explanation: string;
  element2Quote?: string;
  element3Match: "FULL_MATCH" | "PARTIAL_MATCH" | "NO_MATCH";
  element3Explanation: string;
  element3Quote?: string;
  matchedCount: number;
  totalScore: number;
}

// Helper to send SSE messages
function sendProgress(controller: ReadableStreamDefaultController, message: string) {
  try {
    const data = JSON.stringify({ type: "progress", message });
    const encoder = new TextEncoder();
    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
  } catch (e) {
    console.error("Error sending progress:", e);
  }
}

function sendResults(controller: ReadableStreamDefaultController, results: any[]) {
  try {
    const data = JSON.stringify({ type: "results", data: results });
    const encoder = new TextEncoder();
    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
  } catch (e) {
    console.error("Error sending results:", e);
  }
}

// STEP 1: Master Searcher Agent - Generate diverse search queries using Gemini 3 Flash
async function generateSearchQueries(
  element1: string,
  element2: string,
  element3: string
): Promise<string[]> {
  // Build elements list - only include non-empty elements
  const elements: string[] = [];
  if (element1.trim()) elements.push(`Element 1: ${element1}`);
  if (element2.trim()) elements.push(`Element 2: ${element2}`);
  if (element3.trim()) elements.push(`Element 3: ${element3}`);

  const elementsText = elements.join('\n');
  const elementCount = elements.length;

  const prompt = `You are a legal research assistant. A user is searching for cases with ${elementCount === 1 ? 'this specific element' : `these ${elementCount} specific elements`}:

${elementsText}

Your task: Generate 4 diverse search queries that could help find cases matching ${elementCount === 1 ? 'this element' : 'these elements'}. Each query should:
- Use different terminology and phrasing
- ${elementCount > 1 ? 'Combine the elements in different ways' : 'Use various related terms'}
- Include synonyms and related legal terms
- Be optimized for semantic vector search

Return ONLY a JSON array of 4 query strings, nothing else.

Example format: ["query 1", "query 2", "query 3", "query 4"]`;

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY not found in environment variables");
  }

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiApiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000, // Increased to 2000 to handle 4 queries for 3 elements
          responseMimeType: "application/json", // Force JSON response format
        },
      }),
    }
  );

  if (!geminiResponse.ok) {
    console.error("Gemini API error:", await geminiResponse.text());
    throw new Error("Gemini API request failed");
  }

  const geminiData = await geminiResponse.json();
  let content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  console.log("🤖 Gemini 3 Flash raw response for queries:", content);

  // Remove markdown code blocks if present
  content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  console.log("🧹 Cleaned content:", content);

  try {
    const queries = JSON.parse(content);
    console.log("✅ Parsed queries:", queries);
    return Array.isArray(queries) ? queries : [];
  } catch (e) {
    console.error("❌ Failed to parse queries:", e);
    console.error("Raw content:", content);
    // Fallback: combine only non-empty elements
    console.log("⚠️ Using fallback query");
    const fallbackParts = [element1, element2, element3].filter(e => e.trim());
    return [fallbackParts.join(' ')];
  }
}

// STEP 2 & 3: Perform parallel vector searches and deduplicate
async function searchAndDeduplicate(
  queries: string[],
  controller: ReadableStreamDefaultController
): Promise<UniqueCase[]> {
  sendProgress(controller, `🔍 Searching Pinecone vector database with ${queries.length} diverse queries...`);

  // Parallel vector searches - get initial matches to identify relevant cases
  const searchPromises = queries.map(async (query) => {
    const embedding = await getEmbeddings(query);
    const matches = await getMatchesFromEmbeddings(embedding, 25, "", "hk"); // Reduced from 50 to 25
    return matches;
  });

  const allMatches = await Promise.all(searchPromises);
  const flatMatches = allMatches.flat();

  sendProgress(controller, `✓ Retrieved ${flatMatches.length} case chunks from Pinecone`);
  sendProgress(controller, `🔍 Identifying unique cases...`);

  // STEP 3A: First, identify unique cases and collect their metadata
  const caseMetadataMap = new Map<string, any>();

  for (const match of flatMatches) {
    const metadata = match.metadata;
    const raw_case_num = metadata.raw_case_num;

    if (!raw_case_num) continue;

    if (!caseMetadataMap.has(raw_case_num)) {
      // Store metadata for this case
      caseMetadataMap.set(raw_case_num, {
        metadata: metadata,
        vectorScore: match.score || 0,
      });
    } else {
      // Update vector score if higher
      const existing = caseMetadataMap.get(raw_case_num)!;
      if (match.score && match.score > existing.vectorScore) {
        existing.vectorScore = match.score;
      }
    }
  }

  const uniqueCaseIds = Array.from(caseMetadataMap.keys());
  sendProgress(controller, `✓ Found ${uniqueCaseIds.length} unique cases`);

  // STEP 3B: For each unique case, retrieve ALL chunks from Pinecone
  sendProgress(controller, `🔍 Retrieving full text for all ${uniqueCaseIds.length} cases...`);

  const fullCasesPromises = uniqueCaseIds.map(async (caseId) => {
    try {
      // Query Pinecone with filter to get ALL chunks for this specific case
      // Use a dummy embedding - we're filtering by exact case ID so vector doesn't matter
      const dummyEmbedding = new Array(1536).fill(0);

      const allChunks = await getMatchesFromEmbeddings(
        dummyEmbedding,
        1000, // High number to get all chunks for this case
        "",
        "hk",
        { raw_case_num: caseId } // Filter by specific case ID
      );

      // Combine all chunks in order
      const sortedChunks = allChunks.sort((a, b) => {
        // Sort by chunk index if available in metadata
        const aIndex = a.metadata?.chunk_index || 0;
        const bIndex = b.metadata?.chunk_index || 0;
        return aIndex - bIndex;
      });

      let combinedText = "";
      for (const chunk of sortedChunks) {
        if (chunk.metadata?._node_content) {
          try {
            const nodeContent = JSON.parse(chunk.metadata._node_content);
            const chunkText = nodeContent.text || "";
            combinedText += (combinedText ? "\n\n" : "") + chunkText;
          } catch (e) {
            console.error("Error parsing _node_content:", e);
          }
        }
      }

      // Get metadata from our map
      const caseData = caseMetadataMap.get(caseId)!;
      const metadata = caseData.metadata;

      const caseName = Array.isArray(metadata.cases_title)
        ? metadata.cases_title[0]
        : metadata.cases_title || "Unknown Case";
      const caseActionNo = Array.isArray(metadata.cases_act)
        ? metadata.cases_act[0]
        : metadata.cases_act || "N/A";

      // Build URL
      const parts = caseId.split("_");
      let caseUrl = "";
      if (parts.length === 3) {
        const [year, court, caseNumber] = parts;
        caseUrl = `https://www.hklii.hk/en/cases/${court.toLowerCase()}/${year}/${caseNumber}`;
      }

      return {
        raw_case_num: caseId,
        caseName,
        caseNeutralCit: metadata.neutral_cit || "",
        caseActionNo,
        caseDate: metadata.date || "",
        caseUrl,
        combinedText,
        vectorScore: caseData.vectorScore,
      };
    } catch (error) {
      console.error(`Error retrieving full text for case ${caseId}:`, error);
      return null;
    }
  });

  const fullCases = await Promise.all(fullCasesPromises);
  const validCases = fullCases.filter((c): c is UniqueCase => c !== null);

  sendProgress(controller, `✓ Retrieved full text for ${validCases.length} cases`);

  return validCases;
}

// STEP 4: Evaluate each case against the 3 elements using Gemini 3 Flash
async function evaluateCase(
  caseData: UniqueCase,
  element1: string,
  element2: string,
  element3: string
): Promise<ElementEvaluation> {
  // NO TRUNCATION - Send FULL case text to Gemini 3 Flash (1M token context window, faster & cheaper than Pro)
  const fullCaseText = caseData.combinedText;

  // Build elements list - only include non-empty elements
  const elements: string[] = [];
  if (element1.trim()) elements.push(`1. ${element1}`);
  if (element2.trim()) elements.push(`2. ${element2}`);
  if (element3.trim()) elements.push(`3. ${element3}`);

  const elementsText = elements.join('\n');
  const elementCount = elements.length;

  const prompt = `You are evaluating a legal case against ${elementCount} specific element${elementCount > 1 ? 's' : ''}. You must be STRICT and LITERAL in your evaluation.

CASE: ${caseData.caseName}
FULL CASE TEXT:
${fullCaseText}

ELEMENTS TO MATCH:
${elementsText}

CRITICAL INSTRUCTIONS FOR EVALUATION:
- Only use information that is EXPLICITLY stated in the case text
- DO NOT make inferences, assumptions, or educated guesses
- If an element requires a specific fact (e.g., "plaintiff is not a Hong Kong resident"), that exact fact must be clearly stated in the text
- DO NOT assume things based on context clues (e.g., don't assume someone is a non-resident just because they're a domestic helper)
- Be literal and strict - if the element says "plaintiff is not a Hong Kong resident", the case must explicitly state their residency status

For each element, classify it as one of three options:
- **FULL_MATCH**: The case text EXPLICITLY and CLEARLY states facts that match this element
- **PARTIAL_MATCH**: The case mentions related concepts but does NOT explicitly confirm all aspects of the element
- **NO_MATCH**: The case does not match this element, or the required information is not explicitly stated

For each element, you MUST provide:
1. A brief explanation (1-2 sentences)
2. An EXACT QUOTE from the case text that supports your evaluation
   - For FULL_MATCH or PARTIAL_MATCH: Include the most relevant quote that shows the match
   - For NO_MATCH: If the element is mentioned but contradicts, include that quote. If not mentioned at all, leave quote as empty string ""
   - Keep quotes concise but complete enough to understand the context (1-3 sentences from the case)

Return your evaluation in this exact JSON format (use EXACTLY these strings: "FULL_MATCH", "PARTIAL_MATCH", or "NO_MATCH"):
{
  "element1Match": "FULL_MATCH" | "PARTIAL_MATCH" | "NO_MATCH",
  "element1Explanation": "<string>",
  "element1Quote": "<exact quote from case text or empty string if not mentioned>",
  "element2Match": "FULL_MATCH" | "PARTIAL_MATCH" | "NO_MATCH",
  "element2Explanation": "<string>",
  "element2Quote": "<exact quote from case text or empty string if not mentioned>",
  "element3Match": "FULL_MATCH" | "PARTIAL_MATCH" | "NO_MATCH",
  "element3Explanation": "<string>",
  "element3Quote": "<exact quote from case text or empty string if not mentioned>"
}`;

  // Use Gemini 3 Flash via Google AI API (cheaper, faster, same 1M token context)
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY not found in environment variables");
  }

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiApiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 2000, // Increased from 500 to 2000 to prevent truncation
        },
      }),
    }
  );

  if (!geminiResponse.ok) {
    console.error("Gemini API error:", await geminiResponse.text());
    throw new Error("Gemini API request failed");
  }

  const geminiData = await geminiResponse.json();
  let content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

  // Remove markdown code blocks if present
  content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

  try {
    const evaluation = JSON.parse(content);

    // Set defaults for empty elements (elements not provided by user)
    const element1Match = element1.trim() ? evaluation.element1Match : "NO_MATCH";
    const element1Explanation = element1.trim() ? evaluation.element1Explanation : "Element not provided";
    const element1Quote = element1.trim() ? evaluation.element1Quote || "" : "";
    const element2Match = element2.trim() ? evaluation.element2Match : "NO_MATCH";
    const element2Explanation = element2.trim() ? evaluation.element2Explanation : "Element not provided";
    const element2Quote = element2.trim() ? evaluation.element2Quote || "" : "";
    const element3Match = element3.trim() ? evaluation.element3Match : "NO_MATCH";
    const element3Explanation = element3.trim() ? evaluation.element3Explanation : "Element not provided";
    const element3Quote = element3.trim() ? evaluation.element3Quote || "" : "";

    // Count full matches (only count provided elements)
    const matchedCount = [
      element1.trim() && element1Match === "FULL_MATCH" ? 1 : 0,
      element2.trim() && element2Match === "FULL_MATCH" ? 1 : 0,
      element3.trim() && element3Match === "FULL_MATCH" ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    // Total score: FULL_MATCH=10, PARTIAL_MATCH=5, NO_MATCH=0 (only count provided elements)
    const totalScore =
      (element1.trim() ? (element1Match === "FULL_MATCH" ? 10 : element1Match === "PARTIAL_MATCH" ? 5 : 0) : 0) +
      (element2.trim() ? (element2Match === "FULL_MATCH" ? 10 : element2Match === "PARTIAL_MATCH" ? 5 : 0) : 0) +
      (element3.trim() ? (element3Match === "FULL_MATCH" ? 10 : element3Match === "PARTIAL_MATCH" ? 5 : 0) : 0);

    return {
      element1Match,
      element1Explanation,
      element1Quote,
      element2Match,
      element2Explanation,
      element2Quote,
      element3Match,
      element3Explanation,
      element3Quote,
      matchedCount,
      totalScore,
    };
  } catch (e) {
    console.error("Failed to parse Gemini evaluation:", e);
    console.error("Raw content:", content);
    return {
      element1Match: "NO_MATCH",
      element1Explanation: "Error evaluating this element",
      element1Quote: "",
      element2Match: "NO_MATCH",
      element2Explanation: "Error evaluating this element",
      element2Quote: "",
      element3Match: "NO_MATCH",
      element3Explanation: "Error evaluating this element",
      element3Quote: "",
      matchedCount: 0,
      totalScore: 0,
    };
  }
}

// STEP 5: Batch evaluate all cases
async function batchEvaluateCases(
  cases: UniqueCase[],
  element1: string,
  element2: string,
  element3: string,
  controller: ReadableStreamDefaultController
) {
  const batchSize = 15;
  const results = [];

  for (let i = 0; i < cases.length; i += batchSize) {
    const batch = cases.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(cases.length / batchSize);

    sendProgress(
      controller,
      `🔍 Evaluating cases against your 3 elements (batch ${batchNumber}/${totalBatches})...`
    );

    const evaluations = await Promise.all(
      batch.map((caseData) => evaluateCase(caseData, element1, element2, element3))
    );

    for (let j = 0; j < batch.length; j++) {
      results.push({
        ...batch[j],
        ...evaluations[j],
      });
    }

    sendProgress(controller, `✓ Evaluated ${Math.min(i + batchSize, cases.length)}/${cases.length} cases`);
  }

  return results;
}

export async function POST(req: Request) {
  try {
    const body: ElementSearchRequest = await req.json();
    const { element1, element2, element3 } = body;

    // Check if at least one element is provided
    const hasAtLeastOne = element1?.trim() || element2?.trim() || element3?.trim();
    if (!hasAtLeastOne) {
      return new NextResponse("At least one element is required", { status: 400 });
    }

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // STEP 1: Generate search queries
          sendProgress(controller, "🔍 Generating search queries from your elements...");
          const queries = await generateSearchQueries(element1, element2, element3);
          sendProgress(controller, `✓ Generated ${queries.length} diverse search strategies:`);
          queries.forEach((query, idx) => {
            sendProgress(controller, `  ${idx + 1}. "${query}"`);
          });

          // STEP 2 & 3: Search and deduplicate
          const uniqueCases = await searchAndDeduplicate(queries, controller);

          if (uniqueCases.length === 0) {
            sendProgress(controller, "❌ No cases found matching your criteria");
            sendResults(controller, []);
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }

          // STEP 4 & 5: Batch evaluate
          const evaluatedResults = await batchEvaluateCases(
            uniqueCases,
            element1,
            element2,
            element3,
            controller
          );

          // Sort by matched count (desc), then total score (desc)
          const sortedResults = evaluatedResults.sort((a, b) => {
            if (b.matchedCount !== a.matchedCount) {
              return b.matchedCount - a.matchedCount;
            }
            return b.totalScore - a.totalScore;
          });

          // Send summary
          const summary = {
            total: sortedResults.length,
            threeElements: sortedResults.filter((r) => r.matchedCount === 3).length,
            twoElements: sortedResults.filter((r) => r.matchedCount === 2).length,
            oneElement: sortedResults.filter((r) => r.matchedCount === 1).length,
          };

          sendProgress(
            controller,
            `✅ Search complete! Found ${summary.threeElements} cases with all 3 elements, ${summary.twoElements} with 2 elements, ${summary.oneElement} with 1 element`
          );

          // Send final results
          console.log("📤 Sending results to frontend. Count:", sortedResults.length);
          console.log("📋 First result sample:", sortedResults[0] ? {
            caseName: sortedResults[0].caseName,
            matchedCount: sortedResults[0].matchedCount,
            element1Match: sortedResults[0].element1Match,
            element2Match: sortedResults[0].element2Match,
            element3Match: sortedResults[0].element3Match,
          } : "No results");
          sendResults(controller, sortedResults);

          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          try {
            const encoder = new TextEncoder();
            const errorData = JSON.stringify({ type: "error", message: String(error) });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (e) {
            // Controller might already be closed
            console.error("Error sending error message:", e);
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
