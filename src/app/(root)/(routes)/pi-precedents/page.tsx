"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Zap, TrendingUp, Target } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ProgressMessage {
  type: "progress" | "result" | "error";
  message: string;
}

type SearchMode = "fast" | "medium" | "deep";

export default function PIPrecedentsPage() {
  const [clientDescription, setClientDescription] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("medium");
  const [isSearching, setIsSearching] = useState(false);
  const [progressMessages, setProgressMessages] = useState<ProgressMessage[]>([]);
  const [finalReport, setFinalReport] = useState<string>("");

  const handleSearch = async () => {
    if (!clientDescription.trim()) {
      alert("Please enter a client description");
      return;
    }

    setIsSearching(true);
    setProgressMessages([]);
    setFinalReport("");

    try {
      const response = await fetch("/api/pi-precedents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientDescription: clientDescription.trim(),
          searchMode,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Response body is null");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              setIsSearching(false);
              continue;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === "progress") {
                setProgressMessages((prev) => [
                  ...prev,
                  { type: "progress", message: parsed.message },
                ]);
              } else if (parsed.type === "result") {
                setFinalReport(parsed.data.report);
                setProgressMessages((prev) => [
                  ...prev,
                  { type: "result", message: "✓ Research complete!" },
                ]);
              } else if (parsed.type === "error") {
                setProgressMessages((prev) => [
                  ...prev,
                  { type: "error", message: parsed.message },
                ]);
                setIsSearching(false);
              }
            } catch (e) {
              console.error("Failed to parse SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      setProgressMessages((prev) => [
        ...prev,
        {
          type: "error",
          message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ]);
      setIsSearching(false);
    }
  };

  return (
    <div className="h-full p-4 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">PI Precedent Research</h1>
          <p className="text-sm text-gray-400 mt-1">
            Describe your client&apos;s situation to find relevant precedent cases
          </p>
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Client Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Example: Client is a 35-year-old chef who suffered a shoulder injury after falling while asleep. He has pre-existing back problems and is unable to work for 6 months..."
            value={clientDescription}
            onChange={(e) => setClientDescription(e.target.value)}
            className="min-h-[150px] bg-gray-900 border-gray-600 text-white"
            disabled={isSearching}
          />

          {/* Search Mode Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Search Depth</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={searchMode === "fast" ? "default" : "outline"}
                onClick={() => setSearchMode("fast")}
                disabled={isSearching}
                className={`flex flex-col items-center py-6 ${
                  searchMode === "fast"
                    ? "bg-blue-600 hover:bg-blue-700 border-blue-500"
                    : "border-gray-600 hover:bg-gray-700"
                }`}
              >
                <Zap className="h-5 w-5 mb-1" />
                <span className="font-semibold">Fast</span>
                <span className="text-xs text-gray-400">~2-3 min</span>
              </Button>

              <Button
                variant={searchMode === "medium" ? "default" : "outline"}
                onClick={() => setSearchMode("medium")}
                disabled={isSearching}
                className={`flex flex-col items-center py-6 ${
                  searchMode === "medium"
                    ? "bg-green-600 hover:bg-green-700 border-green-500"
                    : "border-gray-600 hover:bg-gray-700"
                }`}
              >
                <TrendingUp className="h-5 w-5 mb-1" />
                <span className="font-semibold">Medium</span>
                <span className="text-xs text-gray-400">~4-5 min</span>
              </Button>

              <Button
                variant={searchMode === "deep" ? "default" : "outline"}
                onClick={() => setSearchMode("deep")}
                disabled={isSearching}
                className={`flex flex-col items-center py-6 ${
                  searchMode === "deep"
                    ? "bg-purple-600 hover:bg-purple-700 border-purple-500"
                    : "border-gray-600 hover:bg-gray-700"
                }`}
              >
                <Target className="h-5 w-5 mb-1" />
                <span className="font-semibold">Deep</span>
                <span className="text-xs text-gray-400">~8-10 min</span>
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              {searchMode === "fast" && "Quick preliminary research with 5 search queries and 10 cases analyzed"}
              {searchMode === "medium" && "Balanced search with 10 queries and 20 cases analyzed (Recommended)"}
              {searchMode === "deep" && "Comprehensive search with 20 queries and 30 cases analyzed"}
            </p>
          </div>

          <Button
            onClick={handleSearch}
            disabled={isSearching || !clientDescription.trim()}
            className="w-full"
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              "Search Precedents"
            )}
          </Button>
        </CardContent>
      </Card>

      {progressMessages.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {progressMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`text-sm font-mono ${
                    msg.type === "error"
                      ? "text-red-400"
                      : msg.type === "result"
                      ? "text-green-400 font-bold"
                      : "text-gray-300"
                  }`}
                >
                  {msg.message}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {finalReport && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Research Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold text-white mb-4">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-bold text-white mb-3 mt-6">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-bold text-white mb-2 mt-4">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-gray-300 mb-3">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside text-gray-300 mb-3 space-y-1">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside text-gray-300 mb-3 space-y-1">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-gray-300">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="text-white font-bold">{children}</strong>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {children}
                    </a>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border-collapse border border-gray-600">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-gray-700">
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="bg-gray-800">
                      {children}
                    </tbody>
                  ),
                  tr: ({ children }) => (
                    <tr className="border-b border-gray-600">
                      {children}
                    </tr>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-2 text-left text-white font-semibold border border-gray-600">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-2 text-gray-300 border border-gray-600">
                      {children}
                    </td>
                  ),
                }}
              >
                {finalReport}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
