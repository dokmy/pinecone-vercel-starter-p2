"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useChat } from "ai/react";
import ReactMarkdown from "react-markdown";

interface RawMatch {
  metadata: string;
  score: number;
  chunk: string;
  rerankScore?: number;
  gptScore?: number;
  gptEvaluation?: string;
}

interface SearchRecord {
  id: string;
  query: string;
  rawMatches: RawMatch[];
  rerankedMatches: RawMatch[];
  refinedMatches?: RawMatch[];
  refinedQuery?: string;
}

interface ProcessedMatch {
  caseAct: string;
  score: number;
  gptScore?: number;
  rerankScore?: number;
  url: string;
  chunk: string;
  metadata: string;
  gptEvaluation?: {
    score: number;
  };
}

interface GPTEvaluation {
  score: number;
}

interface CaseAnswer {
  isLoading: boolean;
  content: string;
  error: string | null;
}

function convertToUrl(metadata: any): string {
  const baseUrl = "https://www.hklii.hk/en/cases/";

  if (!metadata.db || !metadata.raw_case_num) {
    return "";
  }

  const court = metadata.db.toLowerCase();
  const caseRef = metadata.raw_case_num;
  const parts = caseRef.split("_");

  if (parts.length !== 3) {
    return "";
  }

  const [year, _, caseNumber] = parts;
  let courtCode = "";

  switch (court) {
    case "hkcfa":
      courtCode = "hkcfa";
      break;
    case "hkca":
      courtCode = "hkca";
      break;
    case "hkcfi":
      courtCode = "hkcfi";
      break;
    case "hkdc":
      courtCode = "hkdc";
      break;
    case "hkfc":
      courtCode = "hkfc";
      break;
    case "hklc":
      courtCode = "hklc";
      break;
    case "hksc":
      courtCode = "hksc";
      break;
    default:
      return "";
  }

  return `${baseUrl}${courtCode}/${year}/${caseNumber}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="text-gray-500 hover:text-gray-700 text-xs flex items-center gap-1"
    >
      {copied ? (
        <span className="text-green-600">Copied!</span>
      ) : (
        <span>Copy</span>
      )}
    </button>
  );
}

function CollapsibleText({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get first two lines
  const previewLines = text.split("\n").slice(0, 2).join("\n");
  const displayText = isExpanded ? text : previewLines;

  return (
    <div className="relative">
      <div
        className={`text-xs text-gray-600 bg-white p-3 rounded border border-gray-200 ${
          isExpanded ? "" : "line-clamp-2"
        }`}
      >
        {displayText}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          <svg
            className={`w-4 h-4 transform transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

function GPTRelevanceScore({
  query,
  chunk,
  existingScore,
}: {
  query: string;
  chunk: string;
  existingScore?: {
    score: number;
  };
}) {
  const [evaluation, setEvaluation] = useState<GPTEvaluation | null>(
    existingScore || null
  );
  const [loading, setLoading] = useState(!existingScore);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvaluation = async () => {
      if (existingScore) return;

      try {
        const response = await fetch("/api/evaluate-relevance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query, chunk }),
        });

        if (!response.ok) {
          throw new Error("Failed to get evaluation");
        }

        const data = await response.json();
        setEvaluation(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to evaluate");
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [query, chunk, existingScore]);

  if (loading) {
    return (
      <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
        <p className="text-xs text-gray-500">Evaluating...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
        <p className="text-xs text-red-500">Failed to evaluate</p>
      </div>
    );
  }

  if (!evaluation) return null;

  return (
    <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
      <span className="text-sm font-semibold text-blue-900">
        Relevance Score: {Math.round(evaluation.score)}/10
      </span>
    </div>
  );
}

function CaseAnswerButton({
  metadata,
  query,
  onComplete,
}: {
  metadata: any;
  query: string;
  onComplete: (answer: string) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  // Initialize useChat hook
  const {
    messages,
    setMessages,
    append,
    isLoading: isChatLoading,
  } = useChat({
    api: "/api/answer-with-case",
    onResponse: (response) => {
      // Check if response is ok
      if (!response.ok) {
        console.error("CaseAnswerButton: Response not ok:", response.status);
      }
    },
    onFinish: (message) => {
      onComplete(message.content);
      setIsLoading(false);
    },
  });

  const handleClick = async () => {
    console.log("CaseAnswerButton: Click handler started");
    console.log("CaseAnswerButton: Metadata:", metadata);
    console.log("CaseAnswerButton: Query:", query);

    setIsLoading(true);
    try {
      console.log("CaseAnswerButton: Fetching case chunks...");
      const response = await fetch("/api/get-case-chunks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caseRef: metadata.raw_case_num,
          db: metadata.db,
        }),
      });

      if (!response.ok) {
        console.error(
          "CaseAnswerButton: Failed to fetch chunks, status:",
          response.status
        );
        throw new Error("Failed to fetch case chunks");
      }

      const chunks = await response.json();
      console.log("CaseAnswerButton: Received chunks count:", chunks.length);

      // Clear any previous messages
      setMessages([]);

      // Send the query and chunks together
      await append(
        {
          role: "user",
          content: query,
          // Include chunks in the function call
          function_call: {
            name: "analyze_case",
            arguments: JSON.stringify({
              chunks: chunks.map((c: any) => c.chunk),
            }),
          },
        },
        {
          options: {
            body: {
              chunks: chunks.map((c: any) => c.chunk),
            },
          },
        }
      );
    } catch (err) {
      console.error("CaseAnswerButton: Error in handle click:", err);
      onComplete("Error: Failed to get answer");
      setIsLoading(false);
    }
  };

  // Get the latest message content for streaming display
  const latestMessage = messages[messages.length - 1]?.content || "";

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading || isChatLoading}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
      >
        {isLoading || isChatLoading
          ? "Getting answer..."
          : "Get whole case and answer query"}
      </button>
      {(isLoading || isChatLoading || latestMessage) && (
        <StreamingAnswer content={latestMessage} />
      )}
    </>
  );
}

function StreamingAnswer({ content }: { content: string }) {
  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="text-xs text-gray-800">
        <ReactMarkdown
          components={{
            pre: ({ node, ...props }) => (
              <div className="overflow-auto w-full my-2 bg-black/5 p-2 rounded">
                <pre {...props} />
              </div>
            ),
            code: ({ node, ...props }) => (
              <code className="bg-black/5 rounded px-1" {...props} />
            ),
            p: ({ node, ...props }) => (
              <p className="mb-2 leading-relaxed" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="text-sm font-semibold mt-3 mb-1" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-xs font-semibold mt-2 mb-1" {...props} />
            ),
            ul: ({ node, ...props }) => (
              <ul className="list-disc list-inside mb-2 text-xs" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol
                className="list-decimal list-inside mb-2 text-xs"
                {...props}
              />
            ),
            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
            blockquote: ({ node, ...props }) => (
              <blockquote
                className="border-l-4 border-gray-200 pl-4 my-2 text-xs"
                {...props}
              />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

function LoadingState() {
  const [seconds, setSeconds] = useState(0);
  const [stage, setStage] = useState("Getting search results");

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    // Update stage based on time
    const stageTimer = setTimeout(() => {
      setStage("Evaluating search results with GPT");
    }, 2000);

    return () => {
      clearInterval(timer);
      clearTimeout(stageTimer);
    };
  }, []);

  return (
    <div className="p-4">
      <div className="flex items-center space-x-2">
        <span className="text-blue-600 font-medium">{stage}</span>
        <span className="text-gray-500">({seconds}s)</span>
      </div>
    </div>
  );
}

function ResultColumn({
  title,
  matches,
  scoreField,
  query,
}: {
  title: string;
  matches: ProcessedMatch[];
  scoreField: "score" | "gptScore";
  query: string;
}) {
  const evaluationQuery = query;
  const [caseAnswers, setCaseAnswers] = useState<{ [key: string]: CaseAnswer }>(
    {}
  );

  const updateCaseAnswer = (matchId: string, answer: string) => {
    setCaseAnswers((prev) => ({
      ...prev,
      [matchId]: {
        isLoading: false,
        content: answer,
        error: null,
      },
    }));
  };

  return (
    <div className="flex-1">
      <div className="mb-4">
        <h2 className="text-base font-semibold mb-2 text-white">{title}</h2>
      </div>

      {/* Horizontal scrolling container */}
      <div className="overflow-x-auto">
        <div className="flex space-x-6" style={{ minWidth: "min-content" }}>
          {matches.map((match, index) => {
            const metadata = JSON.parse(match.metadata || "{}");
            const matchId = `${metadata.raw_case_num || index}-${index}`;

            return (
              <div
                key={index}
                className="bg-gray-50 p-4 rounded-lg flex-shrink-0"
                style={{ width: "calc(33.333vw - 2rem)" }}
              >
                {/* Sticky header */}
                <div className="sticky top-0 bg-gray-50 z-10 pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-lg text-gray-900">
                          {match.caseAct}
                        </p>
                        {match.url && (
                          <Link
                            href={match.url}
                            target="_blank"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View on HKLII
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-bold text-gray-900">
                        Relevance Score: {Math.round(match[scoreField] || 0)}/10
                      </p>
                      <CopyButton text={match.chunk} />
                    </div>
                  </div>
                </div>

                {/* Scrollable content */}
                <div
                  className="overflow-y-auto mt-2"
                  style={{ maxHeight: "calc(100vh - 12rem)" }}
                >
                  <CollapsibleText text={match.chunk} />
                  <GPTRelevanceScore
                    query={evaluationQuery}
                    chunk={match.chunk}
                    existingScore={match.gptEvaluation}
                  />
                  {metadata.raw_case_num && metadata.db && (
                    <CaseAnswerButton
                      metadata={metadata}
                      query={query}
                      onComplete={(answer) => updateCaseAnswer(matchId, answer)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function RetrievalEvalPage() {
  const searchParams = useSearchParams();
  const searchId = searchParams.get("searchId");
  const [searchRecord, setSearchRecord] = useState<SearchRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refinedMatches, setRefinedMatches] = useState<ProcessedMatch[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!searchId) return;

      try {
        setLoading(true);
        const response = await fetch(
          `/api/retrieval-eval?searchId=${searchId}`
        );
        if (!response.ok) throw new Error("Failed to fetch search record");

        const data = await response.json();
        setSearchRecord(data);

        // Process matches (GPT scores already calculated)
        const processMatches = () => {
          const processedMatches = data.rawMatches.map((match: RawMatch) => {
            const metadata = JSON.parse(match.metadata);
            return {
              caseAct: metadata.cases_act || "N/A",
              score: match.score,
              gptScore: match.gptScore || 0,
              gptEvaluation: match.gptEvaluation
                ? JSON.parse(match.gptEvaluation)
                : { score: 0 },
              url: convertToUrl(metadata),
              chunk: match.chunk,
              metadata: match.metadata,
            };
          });

          // Results are already sorted by GPT score
          return processedMatches;
        };

        const processedMatches = processMatches();
        setRefinedMatches(processedMatches);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchId]);

  if (loading) return <LoadingState />;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!searchRecord) return <div className="p-4">No search record found</div>;

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden p-4">
      <div className="mb-4">
        <h1 className="text-lg font-bold mb-1">Search Query</h1>
        <p className="text-base">{searchRecord.query}</p>
      </div>

      <div className="w-full">
        <ResultColumn
          title="Search Results"
          matches={refinedMatches}
          scoreField="gptScore"
          query={searchRecord.query}
        />
      </div>
    </div>
  );
}
