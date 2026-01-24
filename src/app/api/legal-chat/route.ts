import { auth } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { Pinecone } from "@pinecone-database/pinecone";
import { getEmbeddings } from "@/utils/embeddings";
import { getMatchesFromEmbeddings } from "@/utils/pinecone";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_HK!);

// SSE helper functions
function sendSSE(controller: ReadableStreamDefaultController, type: string, data: any) {
  try {
    const encoder = new TextEncoder();
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`));
  } catch (e) {
    console.error("Error sending SSE:", e);
  }
}

// Tool definitions for Gemini 3
const tools = [
  {
    functionDeclarations: [
      {
        name: "searchCases",
        description: "Search the Hong Kong legal case database for relevant precedents. Use this when the user asks about specific cases, precedents, or wants to find cases with specific characteristics (injury type, occupation, circumstances, etc.)",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description: "The search query to find relevant cases. Be specific and include key terms like injury type, occupation, circumstances, etc.",
            },
            numResults: {
              type: Type.NUMBER,
              description: "Number of cases to return (default 5, max 10)",
            },
          },
          required: ["query"],
        },
      },
    ],
  },
  {
    functionDeclarations: [
      {
        name: "getCaseDetails",
        description: "Get the full text and details of a specific case by its case ID. Use this when you need more details about a case that was previously found.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            caseId: {
              type: Type.STRING,
              description: "The case ID (e.g., '2019_HKDC_123') or neutral citation",
            },
          },
          required: ["caseId"],
        },
      },
    ],
  },
];

// Tool execution functions
async function searchCases(query: string, numResults: number = 5): Promise<any> {
  try {
    const embedding = await getEmbeddings(query);

    const searchResults = await pineconeIndex.namespace("").query({
      vector: embedding,
      topK: Math.min(numResults * 3, 30),
      includeMetadata: true,
    });

    const seenCaseIds = new Set<string>();
    const cases: any[] = [];

    for (const match of searchResults.matches) {
      const caseId = match.metadata?.raw_case_num as string;
      if (caseId && !seenCaseIds.has(caseId) && cases.length < numResults) {
        seenCaseIds.add(caseId);

        const metadata = match.metadata;
        const caseName = Array.isArray(metadata?.cases_title)
          ? metadata.cases_title[0]
          : metadata?.cases_title || "Unknown Case";

        const parts = caseId.split("_");
        let caseUrl = "";
        if (parts.length === 3) {
          const [year, court, caseNumber] = parts;
          caseUrl = `https://www.hklii.hk/en/cases/${court.toLowerCase()}/${year}/${caseNumber}`;
        }

        cases.push({
          id: caseId,
          caseName,
          citation: metadata?.neutral_cit || "",
          date: metadata?.date || "",
          url: caseUrl,
          score: match.score,
          snippet: getSnippetFromMetadata(metadata),
        });
      }
    }

    return {
      success: true,
      query,
      casesFound: cases.length,
      cases,
    };
  } catch (error) {
    console.error("Error searching cases:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function getSnippetFromMetadata(metadata: any): string {
  if (metadata?._node_content) {
    try {
      const nodeContent = JSON.parse(metadata._node_content);
      const text = nodeContent.text || "";
      return text.substring(0, 300) + (text.length > 300 ? "..." : "");
    } catch (e) {
      return "";
    }
  }
  return "";
}

async function getCaseDetails(caseId: string): Promise<any> {
  try {
    const dummyEmbedding = new Array(1536).fill(0);
    const allChunks = await getMatchesFromEmbeddings(
      dummyEmbedding,
      1000,
      "",
      "hk",
      { raw_case_num: caseId }
    );

    if (allChunks.length === 0) {
      return {
        success: false,
        error: `Case ${caseId} not found`,
      };
    }

    const sortedChunks = allChunks.sort((a, b) => {
      const aIndex = (a.metadata?.chunk_index as number) || 0;
      const bIndex = (b.metadata?.chunk_index as number) || 0;
      return aIndex - bIndex;
    });

    let fullText = "";
    for (const chunk of sortedChunks) {
      if (chunk.metadata?._node_content) {
        try {
          const nodeContent = JSON.parse(chunk.metadata._node_content as string);
          const chunkText = nodeContent.text || "";
          fullText += (fullText ? "\n\n" : "") + chunkText;
        } catch (e) {
          console.error("Error parsing _node_content:", e);
        }
      }
    }

    const metadata = allChunks[0]?.metadata || {};
    const caseName = Array.isArray(metadata.cases_title)
      ? metadata.cases_title[0]
      : metadata.cases_title || "Unknown Case";

    const parts = caseId.split("_");
    let caseUrl = "";
    if (parts.length === 3) {
      const [year, court, caseNumber] = parts;
      caseUrl = `https://www.hklii.hk/en/cases/${court.toLowerCase()}/${year}/${caseNumber}`;
    }

    return {
      success: true,
      caseId,
      caseName,
      citation: metadata.neutral_cit || "",
      date: metadata.date || "",
      url: caseUrl,
      fullText: fullText.substring(0, 50000),
      textLength: fullText.length,
    };
  } catch (error) {
    console.error("Error getting case details:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function executeTool(name: string, args: any): Promise<any> {
  switch (name) {
    case "searchCases":
      return searchCases(args.query, args.numResults || 5);
    case "getCaseDetails":
      return getCaseDetails(args.caseId);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

const SYSTEM_PROMPT = `You are an expert legal assistant specializing in Hong Kong law, particularly personal injury cases.

Your capabilities:
1. **searchCases** - Search the database for relevant cases. Returns case names, citations, and brief snippets.
2. **getCaseDetails** - Get the FULL TEXT of a specific case. Use the case ID (e.g., "2019_HKDC_123") from search results.
3. You have general knowledge about Hong Kong law, legal procedures, and case law.

## CRITICAL: Reading Full Cases

**YOU MUST use getCaseDetails to read the full case text before providing detailed analysis.**

The search results only return brief snippets - they are NOT sufficient to understand:
- The actual facts of the case
- The court's reasoning
- Specific damages awarded
- How the law was applied

**Workflow:**
1. Use searchCases to find potentially relevant cases
2. Use getCaseDetails on the most promising 1-3 cases to read their FULL content
3. Only then provide your analysis based on the complete case text

Do NOT give detailed case analysis based only on search snippets. If you haven't read the full case, say so.

## Search Guidelines

- You can search multiple times if needed to find relevant cases
- Use different search terms if initial results aren't relevant
- Focus on finding cases that match the user's specific criteria

## Response Guidelines

- Be precise about legal terminology and Hong Kong-specific legal concepts
- If you're unsure about something, say so rather than making up information
- When analyzing cases, focus on key factors like injury type, plaintiff circumstances, and award amounts
- Format your responses clearly with headers, bullet points, and tables when appropriate

## CRITICAL: Quote Original Case Text

**You MUST quote directly from the case text to support your analysis.** Lawyers need to verify your answers.

Use blockquote format (>) for all direct quotes from cases:

> "The court held that the plaintiff's shoulder injury resulted in a 15% permanent disability..."
> — [Case Name](url), para. 45

**Rules for quoting:**
1. Quote the exact text from the case - do not paraphrase when citing legal findings
2. Always indicate the source case and paragraph number if available
3. Use quotes to support: damages awarded, legal principles applied, factual findings, court reasoning
4. Clearly distinguish YOUR analysis from the CASE TEXT

Example format:
The court awarded HK$200,000 for PSLA. As stated in the judgment:

> "Having considered the nature of the injury and the plaintiff's age, I assess general damages for pain, suffering and loss of amenities at HK$200,000."
> — [Chung Ho Ming v Chan Wai Yip](https://www.hklii.hk/en/cases/hkdc/2023/1013), para. 89

This allows lawyers to verify your analysis against the original source.

## CRITICAL: Case References Must Be Hyperlinks

**EVERY case name mentioned MUST be a clickable markdown hyperlink.**

Format: [Case Name](https://www.hklii.hk/en/cases/COURT/YEAR/NUMBER)

Examples:
- [Chung Ho Ming v Chan Wai Yip](https://www.hklii.hk/en/cases/hkdc/2023/1013)
- [Wong Chok Wai v Sun Chung Luen Chinese Products](https://www.hklii.hk/en/cases/hkdc/2007/360)

The URL pattern is: https://www.hklii.hk/en/cases/{court}/{year}/{number}
- court: hkdc, hkcfi, hkca, etc. (lowercase)
- year: e.g., 2023, 2019
- number: case number

**In tables:** The case name column must contain hyperlinks, e.g., | [Case Name](url) | Citation | ...

**In text:** Always write [Case Name](url) instead of just "Case Name".

This is mandatory - users need to click on cases to read them in the viewer panel.`;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new NextResponse("Invalid request body", { status: 400 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Convert messages to Gemini format
          const history = messages.slice(0, -1).map((m: any) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content }],
          }));

          const userMessage = messages[messages.length - 1].content;

          sendSSE(controller, "thinking", {
            content: "Starting to think about your question...",
          });

          // Use streaming with thinking enabled
          const response = await ai.models.generateContentStream({
            model: "gemini-3-flash-preview",
            contents: [
              ...history,
              { role: "user", parts: [{ text: userMessage }] }
            ],
            config: {
              systemInstruction: SYSTEM_PROMPT,
              tools,
              thinkingConfig: {
                thinkingLevel: ThinkingLevel.MEDIUM, // Enable native thinking
                includeThoughts: true,   // Stream the thoughts to us
              },
            },
          });

          let iterations = 0;
          const maxIterations = 10; // Allow more iterations for search + getCaseDetails workflow
          let finalText = "";
          // Store full parts with thoughtSignature preserved
          let pendingFunctionCallParts: any[] = [];
          // Track conversation history for multi-turn function calling
          let conversationContents: any[] = [
            ...history,
            { role: "user", parts: [{ text: userMessage }] }
          ];

          // Process the stream
          let modelParts: any[] = [];
          for await (const chunk of response) {
            const candidate = chunk.candidates?.[0];
            if (!candidate?.content?.parts) continue;

            for (const part of candidate.content.parts) {
              // Handle thought parts (native Gemini 3 thinking!)
              if (part.thought && part.text) {
                sendSSE(controller, "thinking", {
                  content: `💭 ${part.text}`,
                });
              }
              // Handle regular text
              else if (part.text && !part.thought) {
                finalText += part.text;
              }
              // Handle function calls - store the FULL part to preserve thoughtSignature
              else if (part.functionCall) {
                pendingFunctionCallParts.push(part);
              }
              // Collect all parts for history
              modelParts.push(part);
            }
          }

          // Process function calls if any
          while (pendingFunctionCallParts.length > 0 && iterations < maxIterations) {
            iterations++;

            // Add the model's response (with all parts including thoughtSignatures) to conversation
            conversationContents.push({ role: "model", parts: modelParts });

            for (const fullPart of pendingFunctionCallParts) {
              const call = fullPart.functionCall;

              sendSSE(controller, "thinking", {
                content: `Search #${iterations}: Using ${call.name}`,
              });

              sendSSE(controller, "tool_call", {
                name: call.name,
                args: call.args,
              });

              const toolResult = await executeTool(call.name, call.args);

              let summary = "";
              if (call.name === "searchCases" && toolResult.success) {
                const caseNames = toolResult.cases?.slice(0, 3).map((c: any) => c.caseName).join(", ");
                summary = `Found ${toolResult.casesFound} cases: ${caseNames}${toolResult.casesFound > 3 ? '...' : ''}`;
              } else if (call.name === "getCaseDetails" && toolResult.success) {
                summary = `Retrieved full text for: ${toolResult.caseName}`;
              } else if (!toolResult.success) {
                summary = `Tool error: ${toolResult.error}`;
              }

              sendSSE(controller, "tool_result", { summary });

              // Add function response to conversation
              conversationContents.push({
                role: "user",
                parts: [{ functionResponse: { name: call.name, response: toolResult } }]
              });
            }

            // Reset for next iteration
            pendingFunctionCallParts = [];
            finalText = "";
            modelParts = [];

            // Get next response with the full conversation history
            const nextResponse = await ai.models.generateContentStream({
              model: "gemini-3-flash-preview",
              contents: conversationContents,
              config: {
                systemInstruction: SYSTEM_PROMPT,
                tools,
                thinkingConfig: {
                  thinkingLevel: ThinkingLevel.MEDIUM,
                  includeThoughts: true,
                },
              },
            });

            for await (const chunk of nextResponse) {
              const candidate = chunk.candidates?.[0];
              if (!candidate?.content?.parts) continue;

              for (const part of candidate.content.parts) {
                if (part.thought && part.text) {
                  sendSSE(controller, "thinking", {
                    content: `💭 ${part.text}`,
                  });
                } else if (part.text && !part.thought) {
                  finalText += part.text;
                } else if (part.functionCall) {
                  pendingFunctionCallParts.push(part);
                }
                modelParts.push(part);
              }
            }

            if (pendingFunctionCallParts.length > 0) {
              sendSSE(controller, "thinking", {
                content: `Model wants to search again (${iterations}/${maxIterations} searches used)...`,
              });
            }
          }

          // If we hit max iterations and still have pending calls
          if (iterations >= maxIterations && pendingFunctionCallParts.length > 0) {
            sendSSE(controller, "thinking", {
              content: `Reached maximum search limit (${maxIterations}). Generating final response...`,
            });

            // Add the model parts to conversation before asking for final answer
            conversationContents.push({ role: "model", parts: modelParts });
            conversationContents.push({
              role: "user",
              parts: [{ text: "Please provide your best answer based on the cases found so far. Do not search anymore." }]
            });

            const finalResponse = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: conversationContents,
              config: {
                systemInstruction: SYSTEM_PROMPT,
                thinkingConfig: {
                  thinkingLevel: ThinkingLevel.LOW,
                },
              },
            });

            finalText = finalResponse.text || "Unable to generate response.";
          }

          if (!finalText) {
            finalText = "I couldn't generate a response. Please try again.";
          }

          sendSSE(controller, "final", { content: finalText });

          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();

        } catch (error) {
          console.error("=== LEGAL CHAT ERROR ===");
          console.error("Error type:", error?.constructor?.name);
          console.error("Error message:", error instanceof Error ? error.message : String(error));
          console.error("Error stack:", error instanceof Error ? error.stack : "No stack");

          sendSSE(controller, "final", {
            content: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
          });
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
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("Legal chat error:", error);
    return new NextResponse(
      `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      { status: 500 }
    );
  }
}
