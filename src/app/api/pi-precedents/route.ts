import { auth } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { Pinecone } from "@pinecone-database/pinecone";
import { getEmbeddings } from "@/utils/embeddings";
import { getMatchesFromEmbeddings } from "@/utils/pinecone";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_HK!);

// Helper function to send progress updates via SSE
function sendProgress(controller: ReadableStreamDefaultController, message: string) {
  try {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const data = JSON.stringify({ type: "progress", message: `[${timestamp}] ${message}` });
    const encoder = new TextEncoder();
    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
  } catch (e) {
    console.error("Error sending progress:", e);
  }
}

// Helper function to send error via SSE
function sendError(controller: ReadableStreamDefaultController, message: string) {
  try {
    const data = JSON.stringify({ type: "error", message });
    const encoder = new TextEncoder();
    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
  } catch (e) {
    console.error("Error sending error:", e);
  }
}

// Helper function to send final result via SSE
function sendResult(controller: ReadableStreamDefaultController, result: any) {
  try {
    const data = JSON.stringify({ type: "result", data: result });
    const encoder = new TextEncoder();
    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
  } catch (e) {
    console.error("Error sending result:", e);
  }
}

interface SearchQuery {
  query: string;
  rationale: string;
}

interface SearchModeConfig {
  numQueries: number;
  topKPerQuery: number;
  maxCasesForExtraction: number;
}

const SEARCH_MODE_CONFIGS: Record<string, SearchModeConfig> = {
  fast: {
    numQueries: 5,
    topKPerQuery: 10,
    maxCasesForExtraction: 10,
  },
  medium: {
    numQueries: 10,
    topKPerQuery: 15,
    maxCasesForExtraction: 20,
  },
  deep: {
    numQueries: 20,
    topKPerQuery: 25,
    maxCasesForExtraction: 30,
  },
};

// Phase 1: Generate diverse search queries
async function generateSearchQueries(
  clientDescription: string,
  numQueries: number
): Promise<SearchQuery[]> {
  const prompt = `You are a legal research assistant specializing in personal injury cases in Hong Kong.

Given the following client description, generate ${numQueries} diverse search queries to find relevant precedent cases.

Client Description:
${clientDescription}

IMPORTANT INSTRUCTIONS:
1. Analyze the client description to identify key elements (injury type, occupation, circumstances, age, pre-existing conditions, etc.)
2. Generate queries with various strategies:
   - Comprehensive queries combining multiple elements
   - Focused queries on specific key elements (injury type, occupation, circumstances)
   - Individual element queries for breadth
   - Queries using legal terminology and common phrases
3. Adapt your strategy based on what elements are actually present in the description
4. Use both English and Chinese terms where appropriate for Hong Kong cases
5. Generate exactly ${numQueries} queries

Return your response in this JSON format:
{
  "queries": [
    {
      "query": "the search query string",
      "rationale": "brief explanation of this query strategy"
    }
  ]
}`;

  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      temperature: 0.8,
      maxOutputTokens: 3000,
      responseMimeType: "application/json",
    },
  });

  const text = result.text || "";
  const parsed = JSON.parse(text);
  return parsed.queries || [];
}

interface RelevanceScore {
  caseId: string;
  score: number;
  reasoning: string;
}

// Phase 2: Score cases for relevance
async function scoreRelevance(
  cases: any[],
  clientDescription: string,
  maxCases: number,
  controller: ReadableStreamDefaultController
): Promise<any[]> {
  sendProgress(controller, `\n--- Phase 2: Relevance Filtering ---`);
  sendProgress(controller, `Evaluating ${cases.length} cases for relevance...`);

  // Process individual cases concurrently in batches to respect rate limits
  // With 1000 RPM, we can safely do 50 concurrent requests
  const CONCURRENT_BATCH_SIZE = 50;
  const allScores: RelevanceScore[] = [];

  for (let i = 0; i < cases.length; i += CONCURRENT_BATCH_SIZE) {
    const batch = cases.slice(i, i + CONCURRENT_BATCH_SIZE);

    const batchPromises = batch.map(async (caseData, idx) => {
      const caseNum = i + idx + 1;

      const prompt = `You are a legal research assistant evaluating case relevance for personal injury precedent research.

Client Description:
${clientDescription}

Case to Evaluate:
ID: ${caseData.id}
Name: ${caseData.caseName}
Citation: ${caseData.caseNeutralCit}
Date: ${caseData.caseDate}

Full Case Text:
${caseData.fullText}

Assign a relevance score from 1-5:
- 5: Highly relevant - very similar circumstances, injury type, or occupation
- 4: Relevant - shares multiple important elements with client situation
- 3: Moderately relevant - shares some important elements
- 2: Marginally relevant - only tangentially related
- 1: Not relevant - different case type or circumstances

Return your response in this JSON format:
{
  "caseId": "${caseData.id}",
  "score": 1-5,
  "reasoning": "brief explanation"
}`;

      try {
        const result = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            temperature: 0.3,
            maxOutputTokens: 4000,
            responseMimeType: "application/json",
          },
        });

        const text = result.text || "";
        const parsed = JSON.parse(text);

        sendProgress(controller, `  ✓ Case ${caseNum}/${cases.length}: Score ${parsed.score}/5`);

        return parsed as RelevanceScore;
      } catch (error) {
        console.error(`Error scoring case ${caseNum}:`, error);
        sendProgress(controller, `  ⚠ Error evaluating case ${caseNum}`);
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    const validResults = batchResults.filter((r): r is RelevanceScore => r !== null);
    allScores.push(...validResults);

    sendProgress(controller, `  Completed batch ${Math.floor(i / CONCURRENT_BATCH_SIZE) + 1}/${Math.ceil(cases.length / CONCURRENT_BATCH_SIZE)}`);

    // Small delay between batches to be safe
    if (i + CONCURRENT_BATCH_SIZE < cases.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Sort by score descending and take top N cases based on search mode
  const sortedScores = allScores.sort((a, b) => b.score - a.score);
  const topScores = sortedScores.slice(0, maxCases);

  const topCaseIds = new Set(topScores.map(s => s.caseId));
  const relevantCases = cases.filter(c => topCaseIds.has(c.id));

  // Sort cases by their relevance score
  const scoreMap = new Map(topScores.map(s => [s.caseId, s.score]));
  relevantCases.sort((a, b) => (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0));

  sendProgress(controller, `✓ Selected top ${relevantCases.length} most relevant cases (scores: ${topScores[0]?.score}-${topScores[topScores.length-1]?.score})`);

  return relevantCases;
}

interface AwardData {
  caseId: string;
  caseName: string;
  caseNeutralCit: string;
  caseDate: string;
  caseUrl: string;
  plaintiffAge?: string;
  plaintiffOccupation?: string;
  injuryType: string;
  injurySeverity?: string;
  pslaAward?: string;
  totalAward?: string;
  lossOfEarnings?: string;
  keyFactors: string[];
}

// Phase 3: Extract award data from relevant cases
async function extractAwardData(
  cases: any[],
  controller: ReadableStreamDefaultController
): Promise<AwardData[]> {
  sendProgress(controller, `\n--- Phase 3: Award Data Extraction ---`);
  sendProgress(controller, `Extracting compensation data from ${cases.length} cases...`);

  const allAwardData: AwardData[] = [];

  // Process in batches of 8 concurrent requests (staying under 10/minute rate limit)
  const BATCH_SIZE = 8;
  const BATCH_DELAY = 10000; // 10 seconds between batches

  for (let batchStart = 0; batchStart < cases.length; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, cases.length);
    const batch = cases.slice(batchStart, batchEnd);

    sendProgress(controller, `  Processing batch ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(cases.length / BATCH_SIZE)} (cases ${batchStart + 1}-${batchEnd})...`);

    // Process all cases in this batch concurrently
    const batchPromises = batch.map(async (caseData, idx) => {
      const caseNum = batchStart + idx + 1;

      const prompt = `You are a legal research assistant extracting compensation data from Hong Kong personal injury cases.

Case Information:
Name: ${caseData.caseName}
Citation: ${caseData.caseNeutralCit}
Date: ${caseData.caseDate}

Full Case Text:
${caseData.fullText}

Extract the following information:
1. Plaintiff's age (if mentioned)
2. Plaintiff's occupation (if mentioned)
3. Type of injury (e.g., "shoulder injury", "back injury", "multiple injuries")
4. Injury severity (e.g., "severe", "moderate", "mild" - based on case description)
5. PSLA award amount (Pain, Suffering and Loss of Amenities)
6. Total award amount
7. Loss of earnings amount
8. Key factors that influenced the award (list 2-5 important points)

Return your response in this JSON format:
{
  "plaintiffAge": "age or null",
  "plaintiffOccupation": "occupation or null",
  "injuryType": "description of injury",
  "injurySeverity": "severity or null",
  "pslaAward": "amount in HKD or null",
  "totalAward": "amount in HKD or null",
  "lossOfEarnings": "amount in HKD or null",
  "keyFactors": ["factor 1", "factor 2", ...]
}

IMPORTANT:
- For monetary amounts, include currency symbol and numbers (e.g., "HKD 500,000" or "$500,000")
- If information is not found, use null
- Be precise with injury descriptions`;

      try {
        const result = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            temperature: 0.2,
            maxOutputTokens: 4000,
            responseMimeType: "application/json",
          },
        });

        const text = result.text || "";
        const parsed = JSON.parse(text);

        return {
          caseId: caseData.id,
          caseName: caseData.caseName,
          caseNeutralCit: caseData.caseNeutralCit,
          caseDate: caseData.caseDate,
          caseUrl: caseData.caseUrl,
          plaintiffAge: parsed.plaintiffAge,
          plaintiffOccupation: parsed.plaintiffOccupation,
          injuryType: parsed.injuryType,
          injurySeverity: parsed.injurySeverity,
          pslaAward: parsed.pslaAward,
          totalAward: parsed.totalAward,
          lossOfEarnings: parsed.lossOfEarnings,
          keyFactors: parsed.keyFactors || [],
        };
      } catch (error) {
        console.error(`Error extracting award data for case ${caseNum}:`, error);
        sendProgress(controller, `  ⚠ Error extracting data from case ${caseNum}`);
        return null;
      }
    });

    // Wait for all cases in this batch to complete
    const batchResults = await Promise.all(batchPromises);

    // Add successful extractions to results
    for (const result of batchResults) {
      if (result) {
        allAwardData.push(result);
      }
    }

    sendProgress(controller, `  ✓ Batch complete: ${allAwardData.length}/${cases.length} cases extracted so far`);

    // Wait before next batch (except for last batch)
    if (batchEnd < cases.length) {
      sendProgress(controller, `  ⏳ Waiting 10 seconds before next batch...`);
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  }

  sendProgress(controller, `✓ Extracted award data from ${allAwardData.length} cases`);

  return allAwardData;
}

// Phase 4: Generate final report
async function generateReport(
  clientDescription: string,
  awardData: AwardData[],
  controller: ReadableStreamDefaultController
): Promise<string> {
  sendProgress(controller, `\n--- Phase 4: Report Generation ---`);
  sendProgress(controller, `Generating comprehensive precedent report...`);

  const caseSummaries = awardData.map((data, idx) => {
    return `Case ${idx + 1}: ${data.caseName} [${data.caseNeutralCit}]
- Date: ${data.caseDate}
- Plaintiff: ${data.plaintiffAge ? `Age ${data.plaintiffAge}` : "Age not specified"}${data.plaintiffOccupation ? `, ${data.plaintiffOccupation}` : ""}
- Injury: ${data.injuryType}${data.injurySeverity ? ` (${data.injurySeverity})` : ""}
- PSLA Award: ${data.pslaAward || "Not specified"}
- Total Award: ${data.totalAward || "Not specified"}
- Loss of Earnings: ${data.lossOfEarnings || "Not specified"}
- Key Factors: ${data.keyFactors.join("; ")}
- URL: ${data.caseUrl}`;
  }).join("\n\n");

  const prompt = `You are a senior legal research assistant preparing a personal injury precedent report for Hong Kong lawyers.

Client Description:
${clientDescription}

Relevant Precedent Cases:
${caseSummaries}

Generate a comprehensive report in markdown format with the following structure:

# Personal Injury Precedent Research Report

## Executive Summary
Brief overview of the research findings and recommended compensation range.

## Recommended Compensation Range
Based on the precedents found, provide a suggested range for:
- PSLA (Pain, Suffering and Loss of Amenities)
- Total Compensation
- Any other relevant heads of damage

Justify your recommendation based on the cases.

## Precedent Cases Analysis

Group the cases into 2-4 categories based on similarity or award ranges. For each group:
- Provide a descriptive heading
- List relevant cases with key details
- Explain what makes these cases relevant

Format each case as:
**[Case Name] [[Citation]](URL)** (Date)
- Plaintiff details
- Injury description
- Awards: PSLA: [amount], Total: [amount]
- Key factors

## Key Factors to Note
Important considerations that may affect the compensation:
- Factors that increase compensation
- Factors that may reduce compensation
- Special circumstances to consider

## Conclusion
Final thoughts and recommendations for the lawyer.

IMPORTANT:
- Use clear, professional legal language
- Organize cases logically (by similarity, award amount, or injury severity)
- Make the report actionable for lawyers
- Ensure all URLs are properly formatted as markdown links`;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.4,
        maxOutputTokens: 8000,
      },
    });

    const report = result.text || "";
    sendProgress(controller, `✓ Report generated successfully`);
    return report;
  } catch (error) {
    console.error("Error generating report:", error);
    throw new Error("Failed to generate report");
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { clientDescription, searchMode = "medium" } = body;

    if (!clientDescription || typeof clientDescription !== "string") {
      return new NextResponse("Invalid request body", { status: 400 });
    }

    // Get configuration for the selected search mode
    const config = SEARCH_MODE_CONFIGS[searchMode] || SEARCH_MODE_CONFIGS.medium;

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        try {
          sendProgress(controller, `Starting PI precedent research (${searchMode.toUpperCase()} mode)...`);
          sendProgress(controller, `Client: ${clientDescription.substring(0, 100)}...`);

          // Phase 1: Generate search queries
          sendProgress(controller, `\n--- Phase 1: Search Query Generation ---`);
          const searchQueries = await generateSearchQueries(clientDescription, config.numQueries);
          sendProgress(controller, `✓ Generated ${searchQueries.length} diverse search strategies:`);
          searchQueries.forEach((sq, idx) => {
            sendProgress(controller, `  ${idx + 1}. "${sq.query}"`);
            sendProgress(controller, `     → ${sq.rationale}`);
          });

          // Search Pinecone with all queries
          sendProgress(controller, `\nSearching Pinecone with ${searchQueries.length} queries (${config.topKPerQuery} matches per query)...`);
          const allResults: any[] = [];
          const seenCaseIds = new Set<string>();

          for (let i = 0; i < searchQueries.length; i++) {
            const query = searchQueries[i].query;

            try {
              const embedding = await getEmbeddings(query);

              const searchResults = await pineconeIndex.namespace("").query({
                vector: embedding,
                topK: config.topKPerQuery,
                includeMetadata: true,
              });

              let newCases = 0;
              const totalMatches = searchResults.matches.length;

              for (const match of searchResults.matches) {
                const caseId = match.metadata?.raw_case_num as string | undefined;
                if (caseId && !seenCaseIds.has(caseId)) {
                  seenCaseIds.add(caseId);
                  allResults.push({
                    id: caseId,
                    score: match.score,
                    metadata: match.metadata,
                  });
                  newCases++;
                }
              }

              sendProgress(controller, `  ✓ Query ${i + 1}/${searchQueries.length}: Found ${totalMatches} matches, ${newCases} new (${allResults.length} total unique)`);
            } catch (error) {
              console.error(`Error searching with query ${i + 1}:`, error);
              const errorMsg = error instanceof Error ? error.message : String(error);
              sendProgress(controller, `  ⚠ Query ${i + 1}/${searchQueries.length}: Error - ${errorMsg}`);
            }

            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 300));
          }

          sendProgress(controller, `✓ Search complete: ${allResults.length} unique cases found`);

          if (allResults.length === 0) {
            sendError(controller, "No cases found. Try a different description.");
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }

          // Fetch full case texts from Pinecone
          sendProgress(controller, `\nFetching full case texts from Pinecone...`);
          const casesWithText = await Promise.all(
            allResults.map(async (result) => {
              try {
                const caseId = result.id;

                // Use dummy embedding and filter by case ID to get all chunks
                const dummyEmbedding = new Array(1536).fill(0);
                const allChunks = await getMatchesFromEmbeddings(
                  dummyEmbedding,
                  1000,
                  "",
                  "hk",
                  { raw_case_num: caseId }
                );

                // Sort chunks by index and combine text
                const sortedChunks = allChunks.sort((a, b) => {
                  const aIndex = a.metadata?.chunk_index || 0;
                  const bIndex = b.metadata?.chunk_index || 0;
                  return aIndex - bIndex;
                });

                let fullText = "";
                for (const chunk of sortedChunks) {
                  if (chunk.metadata?._node_content) {
                    try {
                      const nodeContent = JSON.parse(chunk.metadata._node_content);
                      const chunkText = nodeContent.text || "";
                      fullText += (fullText ? "\n\n" : "") + chunkText;
                    } catch (e) {
                      console.error("Error parsing _node_content:", e);
                    }
                  }
                }

                // Extract metadata from first result
                const metadata = result.metadata;
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
                  id: caseId,
                  caseName,
                  caseNeutralCit: metadata.neutral_cit || "",
                  caseActionNo,
                  caseDate: metadata.date || "",
                  caseUrl,
                  fullText,
                };
              } catch (error) {
                console.error(`Error fetching case ${result.id}:`, error);
                return null;
              }
            })
          );

          const validCases = casesWithText.filter((c) => c !== null) as any[];
          sendProgress(controller, `✓ Retrieved ${validCases.length} complete cases`);

          // Phase 2: Relevance filtering
          const relevantCases = await scoreRelevance(
            validCases,
            clientDescription,
            config.maxCasesForExtraction,
            controller
          );

          if (relevantCases.length === 0) {
            sendError(controller, "No relevant cases found after filtering.");
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }

          // Phase 3: Extract award data
          const awardData = await extractAwardData(relevantCases, controller);

          // Phase 4: Generate report
          const report = await generateReport(clientDescription, awardData, controller);

          // Send final result
          sendResult(controller, { report });

          // Send completion signal
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Error in PI precedents search:", error);
          sendError(
            controller,
            `Error: ${error instanceof Error ? error.message : "Unknown error"}`
          );
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[PI_PRECEDENTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
