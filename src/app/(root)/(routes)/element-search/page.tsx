"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Sparkles, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface ElementResult {
  caseName: string;
  caseNeutralCit: string;
  caseActionNo: string;
  caseDate: string;
  caseUrl: string;
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

export default function ElementSearchPage() {
  const router = useRouter();
  const [element1, setElement1] = useState("indecent assault case");
  const [element2, setElement2] = useState("plaintiff is not a Hong Kong resident");
  const [element3, setElement3] = useState("the body part touched is the back");
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [results, setResults] = useState<ElementResult[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [expandedCaseIndex, setExpandedCaseIndex] = useState<number | null>(null);

  // Filtering state - simple non-negotiable element selection
  const [showFilters, setShowFilters] = useState(false);
  const [requiredElements, setRequiredElements] = useState<string[]>([]); // e.g., ["element1", "element2"]

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsSearching(false);
      setProgress((prev) => [...prev, "❌ Search cancelled by user"]);
    }
  };

  const handleSearch = async () => {
    // Check if at least one element is filled
    const hasAtLeastOne = element1.trim() || element2.trim() || element3.trim();
    if (!hasAtLeastOne) {
      alert("Please fill in at least one element");
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setIsSearching(true);
    setProgress([]);
    setResults([]);

    try {
      const response = await fetch("/api/element-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          element1: element1.trim(),
          element2: element2.trim(),
          element3: element3.trim(),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Append to buffer
          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          const lines = buffer.split("\n");

          // Keep the last incomplete line in buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              if (!data) continue;

              try {
                const parsed = JSON.parse(data);
                console.log("📦 Received SSE data type:", parsed.type);
                if (parsed.type === "progress") {
                  setProgress((prev) => [...prev, parsed.message]);
                } else if (parsed.type === "results") {
                  console.log("🎯 Setting results. Count:", parsed.data?.length);
                  // Filter out cases with zero elements matched
                  const filteredResults = parsed.data.filter((r: ElementResult) => r.matchedCount > 0);
                  console.log("🎯 After filtering zero matches. Count:", filteredResults.length);
                  setResults(filteredResults);
                }
              } catch (e) {
                console.error("Error parsing SSE data:", e);
                console.error("Raw data length:", data.length);
                console.error("First 100 chars:", data.substring(0, 100));
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Search error:", error);
      if (error.name === "AbortError") {
        // User cancelled, already handled
      } else {
        alert("Search failed. Please try again.");
      }
    } finally {
      setIsSearching(false);
      setAbortController(null);
    }
  };

  const getMatchBadge = (matchedCount: number, totalElements: number) => {
    // Perfect match (all searched elements matched)
    if (matchedCount === totalElements) {
      if (totalElements === 3) {
        return <Badge className="bg-green-600">✓✓✓ All 3 Elements Matched</Badge>;
      } else if (totalElements === 2) {
        return <Badge className="bg-green-600">✓✓ Both Elements Matched</Badge>;
      } else {
        return <Badge className="bg-green-600">✓ Element Matched</Badge>;
      }
    }
    // Partial matches
    else if (matchedCount === 2) {
      return <Badge className="bg-yellow-600">✓✓ 2 Elements Matched</Badge>;
    } else if (matchedCount === 1) {
      return <Badge className="bg-yellow-600">✓ 1 Element Matched</Badge>;
    } else {
      return <Badge className="bg-red-500">No Elements Matched</Badge>;
    }
  };

  const getElementBadge = (matchType: "FULL_MATCH" | "PARTIAL_MATCH" | "NO_MATCH") => {
    if (matchType === "FULL_MATCH") {
      return <Badge className="bg-green-600">✓ Full Match</Badge>;
    } else if (matchType === "PARTIAL_MATCH") {
      return <Badge className="bg-yellow-500">~ Partial Match</Badge>;
    } else {
      return <Badge className="bg-gray-400">✗ No Match</Badge>;
    }
  };

  // Filter results based on required elements
  const getFilteredResults = () => {
    if (requiredElements.length === 0) {
      return results; // Show all results if no filters applied
    }

    return results.filter((result) => {
      // Check if all required elements have full or partial match
      for (const reqElement of requiredElements) {
        if (reqElement === "element1") {
          if (result.element1Match !== "FULL_MATCH" && result.element1Match !== "PARTIAL_MATCH") {
            return false;
          }
        } else if (reqElement === "element2") {
          if (result.element2Match !== "FULL_MATCH" && result.element2Match !== "PARTIAL_MATCH") {
            return false;
          }
        } else if (reqElement === "element3") {
          if (result.element3Match !== "FULL_MATCH" && result.element3Match !== "PARTIAL_MATCH") {
            return false;
          }
        }
      }
      return true;
    });
  };

  const toggleRequiredElement = (element: string) => {
    setRequiredElements((prev) =>
      prev.includes(element) ? prev.filter((e) => e !== element) : [...prev, element]
    );
  };

  return (
    <div className="h-full p-4 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-purple-500" />
          <h1 className="text-3xl font-bold">Element Search</h1>
        </div>
        <p className="text-gray-500">
          Define three specific elements you&apos;re looking for in a legal case. Our AI will find cases that match your criteria.
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Define Your Search Elements</CardTitle>
          <CardDescription>
            Describe each element in natural language. Example: &quot;indecent assault&quot;, &quot;victim is a tourist&quot;, &quot;body part touched is the back&quot;
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Element 1</label>
            <Textarea
              placeholder="e.g., indecent assault case"
              value={element1}
              onChange={(e) => setElement1(e.target.value)}
              disabled={isSearching}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Element 2</label>
            <Textarea
              placeholder="e.g., victim is a tourist or non-resident"
              value={element2}
              onChange={(e) => setElement2(e.target.value)}
              disabled={isSearching}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Element 3</label>
            <Textarea
              placeholder="e.g., the body part touched is the back"
              value={element3}
              onChange={(e) => setElement3(e.target.value)}
              disabled={isSearching}
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="flex-1"
              size="lg"
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search Cases
                </>
              )}
            </Button>
            {isSearching && (
              <Button
                onClick={handleCancel}
                variant="destructive"
                size="lg"
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Display */}
      {progress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {progress.map((msg, idx) => (
                <div key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>{msg}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {results.length > 0 && (() => {
        // Calculate how many elements were actually searched
        const totalElements = [element1, element2, element3].filter(e => e.trim()).length;
        const filteredResults = getFilteredResults();

        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                Search Results ({filteredResults.length} of {results.length} cases)
              </h2>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <Card className="border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg">Required Elements</CardTitle>
                  <CardDescription>
                    Select elements that must match (fully or partially) in the results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {element1.trim() && (
                      <Button
                        variant={requiredElements.includes("element1") ? "default" : "outline"}
                        onClick={() => toggleRequiredElement("element1")}
                        className={requiredElements.includes("element1") ? "border-blue-500 bg-blue-600 hover:bg-blue-700" : "border-blue-500 text-blue-400 hover:bg-blue-950"}
                      >
                        Element 1
                      </Button>
                    )}
                    {element2.trim() && (
                      <Button
                        variant={requiredElements.includes("element2") ? "default" : "outline"}
                        onClick={() => toggleRequiredElement("element2")}
                        className={requiredElements.includes("element2") ? "border-green-500 bg-green-600 hover:bg-green-700" : "border-green-500 text-green-400 hover:bg-green-950"}
                      >
                        Element 2
                      </Button>
                    )}
                    {element3.trim() && (
                      <Button
                        variant={requiredElements.includes("element3") ? "default" : "outline"}
                        onClick={() => toggleRequiredElement("element3")}
                        className={requiredElements.includes("element3") ? "border-purple-500 bg-purple-600 hover:bg-purple-700" : "border-purple-500 text-purple-400 hover:bg-purple-950"}
                      >
                        Element 3
                      </Button>
                    )}
                  </div>
                  {requiredElements.length > 0 && (
                    <p className="text-sm text-gray-400 mt-3">
                      Showing only cases where {requiredElements.map(e => e.replace("element", "Element ")).join(", ")} have full or partial matches
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Summary Stats - Dynamic based on number of elements searched */}
            <div className={`grid gap-4 ${totalElements === 1 ? 'grid-cols-1 max-w-md mx-auto' : totalElements === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {totalElements >= 3 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {filteredResults.filter((r) => r.matchedCount === 3).length}
                      </div>
                      <div className="text-sm text-gray-500">All 3 Elements</div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {totalElements >= 2 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${totalElements === 2 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {filteredResults.filter((r) => r.matchedCount === 2).length}
                      </div>
                      <div className="text-sm text-gray-500">{totalElements === 2 ? 'Both Elements' : '2 Elements'}</div>
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${totalElements === 1 ? 'text-green-600' : totalElements === 2 ? 'text-yellow-600' : 'text-gray-500'}`}>
                      {filteredResults.filter((r) => r.matchedCount === 1).length}
                    </div>
                    <div className="text-sm text-gray-500">1 Element</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cases List */}
            {filteredResults.map((result, idx) => {
            const isExpanded = expandedCaseIndex === idx;

            return (
              <Card key={idx} className={isExpanded ? "col-span-full" : ""}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{result.caseName}</CardTitle>
                      <CardDescription>
                        {result.caseNeutralCit} | {result.caseActionNo} | {new Date(result.caseDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      {getMatchBadge(result.matchedCount, totalElements)}
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`case-view-${idx}`}
                          checked={isExpanded}
                          onCheckedChange={(checked) => setExpandedCaseIndex(checked ? idx : null)}
                        />
                        <Label htmlFor={`case-view-${idx}`} className="text-sm cursor-pointer">
                          View Full Case
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isExpanded ? (
                    // Split view with iframe
                    <div className="flex gap-4 h-[600px]">
                      {/* Left side - Case details */}
                      <div className="w-1/2 space-y-4 overflow-y-auto pr-4">
                        <div className="space-y-3">
                          {element1.trim() && (
                            <div className="border-l-4 border-blue-500 pl-4">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-sm">Element 1</span>
                                {getElementBadge(result.element1Match)}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{result.element1Explanation}</p>
                              {result.element1Quote && (
                                <div className="bg-gray-100 border-l-2 border-blue-400 pl-3 py-2 mt-2 rounded">
                                  <p className="text-xs text-gray-700 italic">&quot;{result.element1Quote}&quot;</p>
                                </div>
                              )}
                            </div>
                          )}

                          {element2.trim() && (
                            <div className="border-l-4 border-green-500 pl-4">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-sm">Element 2</span>
                                {getElementBadge(result.element2Match)}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{result.element2Explanation}</p>
                              {result.element2Quote && (
                                <div className="bg-gray-100 border-l-2 border-green-400 pl-3 py-2 mt-2 rounded">
                                  <p className="text-xs text-gray-700 italic">&quot;{result.element2Quote}&quot;</p>
                                </div>
                              )}
                            </div>
                          )}

                          {element3.trim() && (
                            <div className="border-l-4 border-purple-500 pl-4">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-sm">Element 3</span>
                                {getElementBadge(result.element3Match)}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{result.element3Explanation}</p>
                              {result.element3Quote && (
                                <div className="bg-gray-100 border-l-2 border-purple-400 pl-3 py-2 mt-2 rounded">
                                  <p className="text-xs text-gray-700 italic">&quot;{result.element3Quote}&quot;</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right side - iframe */}
                      <div className="w-1/2 border rounded-lg overflow-hidden">
                        <iframe
                          src={result.caseUrl}
                          className="w-full h-full"
                          title={`Case: ${result.caseName}`}
                        />
                      </div>
                    </div>
                  ) : (
                    // Compact view
                    <div className="space-y-3">
                      {element1.trim() && (
                        <div className="border-l-4 border-blue-500 pl-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-sm">Element 1</span>
                            {getElementBadge(result.element1Match)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{result.element1Explanation}</p>
                          {result.element1Quote && (
                            <div className="bg-gray-100 border-l-2 border-blue-400 pl-3 py-2 mt-2 rounded">
                              <p className="text-xs text-gray-700 italic">&quot;{result.element1Quote}&quot;</p>
                            </div>
                          )}
                        </div>
                      )}

                      {element2.trim() && (
                        <div className="border-l-4 border-green-500 pl-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-sm">Element 2</span>
                            {getElementBadge(result.element2Match)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{result.element2Explanation}</p>
                          {result.element2Quote && (
                            <div className="bg-gray-100 border-l-2 border-green-400 pl-3 py-2 mt-2 rounded">
                              <p className="text-xs text-gray-700 italic">&quot;{result.element2Quote}&quot;</p>
                            </div>
                          )}
                        </div>
                      )}

                      {element3.trim() && (
                        <div className="border-l-4 border-purple-500 pl-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-sm">Element 3</span>
                            {getElementBadge(result.element3Match)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{result.element3Explanation}</p>
                          {result.element3Quote && (
                            <div className="bg-gray-100 border-l-2 border-purple-400 pl-3 py-2 mt-2 rounded">
                              <p className="text-xs text-gray-700 italic">&quot;{result.element3Quote}&quot;</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          </div>
        );
      })()}
    </div>
  );
}
