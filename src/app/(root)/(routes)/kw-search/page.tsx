"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useMemo, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ChevronRight,
  X,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface CaseResult {
  title: string;
  path: string;
  pub_date: string;
  db: string;
  act: string;
  neutral: string;
  type: "case";
}

interface LegislationResult {
  title: string;
  subtitle: string;
  path: string;
  pub_date: string;
  db: string;
  cap_version: string;
  type: "legis";
}

type SearchResult = CaseResult | LegislationResult;

interface SearchResponse {
  count: number;
  results: SearchResult[];
}

interface DatabaseCategory {
  id: string;
  label: string;
  children: Database[];
}

interface Database {
  id: string;
  label: string;
  dbId: number;
}

const DATABASE_CATEGORIES: DatabaseCategory[] = [
  {
    id: "english_case",
    label: "English Case Databases",
    children: [
      { id: "court_of_appeal", label: "Court of Appeal", dbId: 2 },
      { id: "court_of_final_appeal", label: "Court of Final Appeal", dbId: 4 },
      {
        id: "uk_privy_council",
        label: "United Kingdom Privy Council Judgments for Hong Kong",
        dbId: 5,
      },
      {
        id: "court_of_first_instance",
        label: "Court of First Instance",
        dbId: 7,
      },
      { id: "district_court", label: "District Court", dbId: 9 },
      { id: "family_court", label: "Family Court", dbId: 11 },
      { id: "competition_tribunal", label: "Competition Tribunal", dbId: 13 },
      { id: "lands_tribunal", label: "Lands Tribunal", dbId: 15 },
      { id: "coroners_court", label: "Coroner's Court", dbId: 17 },
      { id: "labour_tribunal", label: "Labour Tribunal", dbId: 19 },
      { id: "magistrates_courts", label: "Magistrates' Courts", dbId: 21 },
      { id: "small_claims_tribunal", label: "Small Claims Tribunal", dbId: 23 },
      {
        id: "obscene_articles_tribunal",
        label: "Obscene Articles Tribunal",
        dbId: 25,
      },
    ],
  },
  {
    id: "english_legislation",
    label: "English Legislation Databases",
    children: [
      { id: "hk_ordinances", label: "Hong Kong Ordinances", dbId: 27 },
      { id: "hk_regulations", label: "Hong Kong Regulations", dbId: 29 },
      {
        id: "hk_constitutional",
        label: "Hong Kong Constitutional Instruments",
        dbId: 31,
      },
      {
        id: "macao_arrangements",
        label: "Arrangements with the Macao SAR",
        dbId: 33,
      },
      {
        id: "mainland_arrangements",
        label: "Arrangements with the Mainland",
        dbId: 35,
      },
      {
        id: "hksar_agreements",
        label: "Bilateral Agreements Concluded by the HKSAR Government",
        dbId: 37,
      },
      {
        id: "prc_agreements",
        label:
          "Bilateral Agreements Concluded by the Central People's Government",
        dbId: 39,
      },
      { id: "treaties", label: "Treaties", dbId: 41 },
      {
        id: "historical_laws",
        label: "Historical Laws of Hong Kong",
        dbId: 51,
      },
    ],
  },
  {
    id: "english_other",
    label: "English Other Databases",
    children: [
      {
        id: "arbitration_centre",
        label: "Hong Kong International Arbitration Centre",
        dbId: 42,
      },
      {
        id: "lrc_consultation",
        label: "Law Reform Commission Consultation Papers",
        dbId: 44,
      },
      { id: "lrc_reports", label: "Law Reform Commission Reports", dbId: 46 },
      {
        id: "privacy_commissioner_appeal",
        label:
          "Office of the Privacy Commissioner for Personal Data Administrative Appeal...",
        dbId: 48,
      },
      {
        id: "privacy_commissioner_notes",
        label:
          "Office of the Privacy Commissioner for Personal Data Complaint Case Notes",
        dbId: 50,
      },
      { id: "practice_directions", label: "Practice Directions", dbId: 53 },
    ],
  },
  {
    id: "chinese_case",
    label: "中文案例資料庫",
    children: [
      { id: "上訴法庭", label: "上訴法庭", dbId: 1 },
      { id: "終審法院", label: "終審法院", dbId: 3 },
      { id: "原訟法庭", label: "原訟法庭", dbId: 6 },
      { id: "區域法院", label: "區域法院", dbId: 8 },
      { id: "家事法庭", label: "家事法庭", dbId: 10 },
      { id: "競爭事務審裁處", label: "競爭事務審裁處", dbId: 12 },
      { id: "土地審裁處", label: "土地審裁處", dbId: 14 },
      { id: "死因裁判法庭", label: "死因裁判法庭", dbId: 16 },
      { id: "勞資審裁處", label: "勞資審裁處", dbId: 18 },
      { id: "裁判法院", label: "裁判法院", dbId: 20 },
      { id: "小額錢債審裁處", label: "小額錢債審裁處", dbId: 22 },
      { id: "淫褻物品審裁處", label: "淫褻物品審裁處", dbId: 24 },
    ],
  },
  {
    id: "chinese_legislation",
    label: "中文法例資料庫",
    children: [
      { id: "香港法例", label: "香港法例", dbId: 28 },
      { id: "香港規例", label: "香港規例", dbId: 30 },
      {
        id: "香港特別行政區成立時適用的全國性法律",
        label: "香港特別行政區成立時適用的全國性法律",
        dbId: 32,
      },
      {
        id: "香港特別行政區成立後公佈的全國性法律",
        label: "香港特別行政區成立後公佈的全國性法律",
        dbId: 34,
      },
      {
        id: "中央人民政府有關部門規章",
        label: "中央人民政府有關部門規章",
        dbId: 36,
      },
      {
        id: "香港特別行政區政府規章",
        label: "香港特別行政區政府規章",
        dbId: 38,
      },
      { id: "公約", label: "公約", dbId: 40 },
      { id: "香港條約", label: "香港條約", dbId: 59 },
    ],
  },
  {
    id: "chinese_other",
    label: "其他中文資料庫",
    children: [
      {
        id: "法律改革委員會諮詢文件",
        label: "法律改革委員會諮詢文件",
        dbId: 43,
      },
      { id: "法律改革委員會報告書", label: "法律改革委員會報告書", dbId: 45 },
      {
        id: "個人資料私隱專員公署行政上訴委員會判決",
        label: "個人資料私隱專員公署行政上訴委員會判決",
        dbId: 47,
      },
      {
        id: "個人資料私隱專員公署投訴個案撮要",
        label: "個人資料私隱專員公署投訴個案撮要",
        dbId: 49,
      },
      { id: "實務指示", label: "實務指示", dbId: 52 },
    ],
  },
];

interface SearchFormData {
  citation: string;
  caseName: string;
  legislationName: string;
  partiesOfJudgment: string;
  coramOfJudgment: string;
  partiesRepresentation: string;
  charge: string;
  allOfTheseWords: string;
  anyOfTheseWords: string;
  exactPhrase: string;
  startDate: string;
  endDate: string;
  selectedDatabases: string[];
}

interface AnswerState {
  [key: string]: string;
}

export default function KWSearchPage() {
  const [formData, setFormData] = useState<SearchFormData>({
    citation: "",
    caseName: "",
    legislationName: "",
    partiesOfJudgment: "",
    coramOfJudgment: "",
    partiesRepresentation: "",
    charge: "",
    allOfTheseWords: "",
    anyOfTheseWords: "",
    exactPhrase: "",
    startDate: "",
    endDate: "",
    selectedDatabases: [],
  });

  const [searchResults, setSearchResults] = useState<SearchResponse | null>(
    null
  );
  const [fullResults, setFullResults] = useState<SearchResponse | null>(null);
  const [activeFilters, setActiveFilters] = useState({
    selectedDatabases: [] as string[],
    documentTypes: [] as string[],
    dateRange: {
      start: "",
      end: "",
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"relevance" | "date_asc" | "date_desc">(
    "relevance"
  );
  const [itemsPerPage, setItemsPerPage] = useState("20");

  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const [query, setQuery] = useState("");
  const [answers, setAnswers] = useState<AnswerState>({});
  const [isAnswering, setIsAnswering] = useState(false);
  const [resultsToAnalyze, setResultsToAnalyze] = useState("3");
  const abortControllerRef = useRef<AbortController | null>(null);

  // Calculate document type counts and database counts from full results
  const resultStats = useMemo(() => {
    if (!fullResults) return null;

    const stats = {
      documentTypes: {
        "Case(EN)": 0,
        "判案書(英)": 0,
        "Legis(EN)": 0,
      },
      databases: {} as Record<string, number>,
    };

    fullResults.results.forEach((result) => {
      // Count document types
      if (result.type === "case") {
        if (result.db.includes("英")) {
          stats.documentTypes["判案書(英)"]++;
        } else {
          stats.documentTypes["Case(EN)"]++;
        }
      } else {
        stats.documentTypes["Legis(EN)"]++;
      }

      // Count databases
      if (!stats.databases[result.db]) {
        stats.databases[result.db] = 0;
      }
      stats.databases[result.db]++;
    });

    return stats;
  }, [fullResults]);

  // Filter results based on active filters
  const filteredResults = useMemo(() => {
    if (!fullResults) return null;

    let filtered = fullResults.results;

    // Filter by document type
    if (activeFilters.documentTypes.length > 0) {
      filtered = filtered.filter((result) => {
        const type =
          result.type === "case"
            ? result.db.includes("英")
              ? "判案書(英)"
              : "Case(EN)"
            : "Legis(EN)";
        return activeFilters.documentTypes.includes(type);
      });
    }

    // Filter by database
    if (activeFilters.selectedDatabases.length > 0) {
      filtered = filtered.filter((result) =>
        activeFilters.selectedDatabases.includes(result.db)
      );
    }

    // Filter by date range
    if (activeFilters.dateRange.start || activeFilters.dateRange.end) {
      filtered = filtered.filter((result) => {
        const date = new Date(result.pub_date);
        const start = activeFilters.dateRange.start
          ? new Date(activeFilters.dateRange.start)
          : null;
        const end = activeFilters.dateRange.end
          ? new Date(activeFilters.dateRange.end)
          : null;

        return (!start || date >= start) && (!end || date <= end);
      });
    }

    return {
      results: filtered,
      count: filtered.length,
    };
  }, [fullResults, activeFilters]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const category = DATABASE_CATEGORIES.find((c) => c.id === categoryId);
    if (!category) return;

    const childIds = category.children.map((child) => child.id);
    setFormData((prev) => ({
      ...prev,
      selectedDatabases: checked
        ? [...new Set([...prev.selectedDatabases, ...childIds])]
        : prev.selectedDatabases.filter((id) => !childIds.includes(id)),
    }));
  };

  const handleDatabaseChange = (databaseId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      selectedDatabases: checked
        ? [...prev.selectedDatabases, databaseId]
        : prev.selectedDatabases.filter((id) => id !== databaseId),
    }));
  };

  const isCategorySelected = (category: DatabaseCategory) => {
    return category.children.every((child) =>
      formData.selectedDatabases.includes(child.id)
    );
  };

  const isCategoryIndeterminate = (category: DatabaseCategory) => {
    const selectedCount = category.children.filter((child) =>
      formData.selectedDatabases.includes(child.id)
    ).length;
    return selectedCount > 0 && selectedCount < category.children.length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const searchParams = new URLSearchParams();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, value);
        }
      });

      const response = await fetch(`/api/kw-search?${searchParams.toString()}`);
      const data = await response.json();
      setFullResults(data);
      setSearchResults(data);

      // Map the selected database IDs to their labels for the filter
      const selectedDbLabels = formData.selectedDatabases
        .map((dbId) => {
          for (const category of DATABASE_CATEGORIES) {
            const db = category.children.find((child) => child.id === dbId);
            if (db) return db.label;
          }
          return null;
        })
        .filter((label): label is string => label !== null);

      // Initialize filters with the selected databases from the search
      setActiveFilters({
        selectedDatabases: selectedDbLabels,
        documentTypes: [],
        dateRange: { start: "", end: "" },
      });
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      citation: "",
      caseName: "",
      legislationName: "",
      partiesOfJudgment: "",
      coramOfJudgment: "",
      partiesRepresentation: "",
      charge: "",
      allOfTheseWords: "",
      anyOfTheseWords: "",
      exactPhrase: "",
      startDate: "",
      endDate: "",
      selectedDatabases: [],
    });
    setSearchResults(null);
  };

  const sortResults = (results: SearchResult[]) => {
    if (sortBy === "relevance") return results;

    return [...results].sort((a, b) => {
      const dateA = new Date(a.pub_date);
      const dateB = new Date(b.pub_date);
      return sortBy === "date_asc"
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    });
  };

  const handleQuerySubmit = async () => {
    if (!query.trim() || !filteredResults) return;

    setIsAnswering(true);
    setAnswers({});

    // Cancel any ongoing streams
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create a new abort controller
    abortControllerRef.current = new AbortController();

    try {
      // Process the number of results specified by the dropdown
      const resultsToProcess = filteredResults.results.slice(
        0,
        parseInt(resultsToAnalyze)
      );

      // Start streams for selected number of results in parallel
      const streams = resultsToProcess.map(async (result) => {
        try {
          const response = await fetch("/api/kw-search-answer", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ path: result.path, query }),
            signal: abortControllerRef.current?.signal,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to get answer");
          }

          if (!response.body) {
            throw new Error("No response body received");
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let accumulatedText = "";

          console.log("Starting to read stream for path:", result.path);

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log("Stream reading complete for path:", result.path);
              break;
            }

            // Decode the chunk and accumulate the text
            const chunk = decoder.decode(value, { stream: true });
            console.log(
              "Received chunk for path:",
              result.path,
              "Chunk:",
              JSON.stringify(chunk)
            );
            accumulatedText += chunk;

            // Update the answer state with the accumulated text
            setAnswers((prev) => {
              console.log(
                "Updating answers state for path:",
                result.path,
                "New text:",
                JSON.stringify(accumulatedText)
              );
              return {
                ...prev,
                [result.path]: accumulatedText,
              };
            });
          }

          // Final decode to handle any remaining bytes
          const finalChunk = decoder.decode();
          if (finalChunk) {
            console.log(
              "Final chunk received for path:",
              result.path,
              "Chunk:",
              JSON.stringify(finalChunk)
            );
            accumulatedText += finalChunk;
            setAnswers((prev) => ({
              ...prev,
              [result.path]: accumulatedText,
            }));
          }
        } catch (error: any) {
          console.error(`Error processing result ${result.path}:`, error);
          setAnswers((prev) => ({
            ...prev,
            [result.path]: `Error: ${error.message || "Failed to get answer"}`,
          }));
        }
      });

      await Promise.all(streams);
    } catch (error: any) {
      if (error?.name === "AbortError") {
        console.log("Streaming aborted");
      } else {
        console.error("Error getting answers:", error);
      }
    } finally {
      setIsAnswering(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="container-fluid px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Advanced Search</h1>
        {searchResults && (
          <Button
            onClick={() => setSearchResults(null)}
            variant="outline"
            className="text-blue-600"
          >
            ADV SEARCH
          </Button>
        )}
      </div>

      {!searchResults ? (
        <form onSubmit={handleSubmit}>
          <Card className="p-6">
            <div className="grid grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">
                    Search in specific fields
                  </h2>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="citation">Citation</Label>
                      <Input
                        id="citation"
                        placeholder="e.g.1: [2002] HKCFI 1234; e.g.2: CACV 154/1984"
                        value={formData.citation}
                        onChange={(e) =>
                          setFormData({ ...formData, citation: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="caseName">Case Name</Label>
                      <Input
                        id="caseName"
                        placeholder="e.g.1: HKSAR v. CHAN KAM WAH; e.g.2: 香港特別行政區 訴 富士土建香港有限公司"
                        value={formData.caseName}
                        onChange={(e) =>
                          setFormData({ ...formData, caseName: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="legislationName">Legislation name</Label>
                      <Input
                        id="legislationName"
                        placeholder="e.g.1: JUSTICES OF THE PEACE ORDINANCE; e.g.2: 建築物能源效益"
                        value={formData.legislationName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            legislationName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="partiesOfJudgment">
                        Parties of judgment
                      </Label>
                      <Input
                        id="partiesOfJudgment"
                        placeholder="e.g.: B & Q PLC"
                        value={formData.partiesOfJudgment}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            partiesOfJudgment: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="coramOfJudgment">Coram of judgment</Label>
                      <Input
                        id="coramOfJudgment"
                        placeholder="e.g.1: E.C. Barnes, D.J.; e.g.2: 張慧玲"
                        value={formData.coramOfJudgment}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            coramOfJudgment: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="partiesRepresentation">
                        Parties representation
                      </Label>
                      <Input
                        id="partiesRepresentation"
                        placeholder="e.g.1: G. Alderdice; e.g.2: 資深大律師"
                        value={formData.partiesRepresentation}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            partiesRepresentation: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="charge">Charge</Label>
                      <Input
                        id="charge"
                        placeholder="e.g.1: Dangerous driving; e.g.2: 危險駕駛"
                        value={formData.charge}
                        onChange={(e) =>
                          setFormData({ ...formData, charge: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">
                    Search in all fields
                  </h2>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="allOfTheseWords">
                        All of these words
                      </Label>
                      <Input
                        id="allOfTheseWords"
                        placeholder="e.g. breach fiduciary duty"
                        value={formData.allOfTheseWords}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            allOfTheseWords: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="anyOfTheseWords">
                        Any of these words
                      </Label>
                      <Input
                        id="anyOfTheseWords"
                        placeholder="e.g. waste pollution radiation"
                        value={formData.anyOfTheseWords}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            anyOfTheseWords: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="exactPhrase">Exact phrase</Label>
                      <Input
                        id="exactPhrase"
                        placeholder="e.g. parliamentary sovereignty"
                        value={formData.exactPhrase}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            exactPhrase: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">Filter by Date</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            startDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) =>
                          setFormData({ ...formData, endDate: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">
                    Select Scope of Search
                  </h2>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto border rounded-lg p-4">
                    {DATABASE_CATEGORIES.map((category) => (
                      <div key={category.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleCategory(category.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <ChevronRight
                              className={`h-4 w-4 transform transition-transform ${
                                expandedCategories.includes(category.id)
                                  ? "rotate-90"
                                  : ""
                              }`}
                            />
                          </button>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={category.id}
                              checked={isCategorySelected(category)}
                              data-state={
                                isCategoryIndeterminate(category)
                                  ? "indeterminate"
                                  : isCategorySelected(category)
                                  ? "checked"
                                  : "unchecked"
                              }
                              onCheckedChange={(checked) =>
                                handleCategoryChange(
                                  category.id,
                                  checked as boolean
                                )
                              }
                            />
                            <Label
                              htmlFor={category.id}
                              className="font-medium"
                            >
                              {category.label}
                            </Label>
                          </div>
                        </div>
                        {expandedCategories.includes(category.id) && (
                          <div className="ml-6 space-y-2">
                            {category.children.map((database) => (
                              <div
                                key={database.id}
                                className="flex items-center gap-2"
                              >
                                <Checkbox
                                  id={database.id}
                                  checked={formData.selectedDatabases.includes(
                                    database.id
                                  )}
                                  onCheckedChange={(checked) =>
                                    handleDatabaseChange(
                                      database.id,
                                      checked as boolean
                                    )
                                  }
                                />
                                <Label htmlFor={database.id}>
                                  {database.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {formData.selectedDatabases.length} selected
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom centered buttons */}
            <div className="flex justify-center gap-4 mt-8">
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 px-8"
              >
                PERFORM ADVANCED SEARCH
              </Button>
              <Button type="button" variant="outline" onClick={handleReset}>
                RESET FORM
              </Button>
            </div>
          </Card>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-gray-300">Status</h3>
              <div className="mt-2">
                <p className="font-medium text-white">
                  File Count: {filteredResults?.count || 0} files
                </p>
              </div>
            </div>

            {filteredResults?.count === 0 ? (
              <div className="flex-1 mx-8 text-center">
                <div className="bg-gray-800 p-8 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    No Results Found
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Try adjusting your search criteria or filters
                  </p>
                  <Button
                    onClick={() => setSearchResults(null)}
                    variant="outline"
                    className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                  >
                    Return to Search
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 mx-8">
                  <div className="flex gap-4">
                    <Input
                      placeholder="Ask a question about these cases..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="flex-1 bg-gray-800 text-white border-gray-700"
                    />
                    <Select
                      value={resultsToAnalyze}
                      onValueChange={setResultsToAnalyze}
                    >
                      <SelectTrigger className="w-[180px] bg-gray-800 text-white border-gray-700">
                        <SelectValue placeholder="Results to analyze" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 text-white border-gray-700">
                        <SelectItem value="1">Analyze 1 result</SelectItem>
                        <SelectItem value="3">Analyze 3 results</SelectItem>
                        <SelectItem value="5">Analyze 5 results</SelectItem>
                        <SelectItem value="10">Analyze 10 results</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleQuerySubmit}
                      disabled={isAnswering || !query.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isAnswering ? "Analyzing..." : "Ask"}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">Sort By</span>
                    <div className="flex gap-1">
                      <Button
                        variant={
                          sortBy === "relevance" ? "secondary" : "outline"
                        }
                        onClick={() => setSortBy("relevance")}
                        className="bg-blue-900 text-blue-100 hover:bg-blue-800"
                      >
                        RELEVANCE
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSortBy("date_asc")}
                        className={`flex items-center gap-1 ${
                          sortBy === "date_asc"
                            ? "bg-blue-900 text-blue-100"
                            : ""
                        }`}
                      >
                        DATE <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSortBy("date_desc")}
                        className={`flex items-center gap-1 ${
                          sortBy === "date_desc"
                            ? "bg-blue-900 text-blue-100"
                            : ""
                        }`}
                      >
                        DATE <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
                    <SelectTrigger className="w-32 bg-gray-800 text-white border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 text-white border-gray-700">
                      <SelectItem value="10">10 per page</SelectItem>
                      <SelectItem value="20">20 per page</SelectItem>
                      <SelectItem value="50">50 per page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          {filteredResults && filteredResults.count > 0 && (
            <div className="grid grid-cols-5 gap-6">
              {/* Refinement Panel */}
              <div className="space-y-6">
                <Card className="p-4">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold mb-2">Status</h2>
                      <p className="text-sm text-gray-500">
                        File Count: {filteredResults?.count || 0} files
                      </p>
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold mb-2">
                        Refine Scope
                      </h2>

                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium mb-2">
                            Document Type
                          </h3>
                          {resultStats &&
                            Object.entries(resultStats.documentTypes).map(
                              ([type, count]) => (
                                <div
                                  key={type}
                                  className="flex items-center gap-2 mb-1"
                                >
                                  <Checkbox
                                    checked={activeFilters.documentTypes.includes(
                                      type
                                    )}
                                    onCheckedChange={(checked) => {
                                      setActiveFilters((prev) => ({
                                        ...prev,
                                        documentTypes: checked
                                          ? [...prev.documentTypes, type]
                                          : prev.documentTypes.filter(
                                              (t) => t !== type
                                            ),
                                      }));
                                    }}
                                  />
                                  <span className="text-sm flex-1">{type}</span>
                                  <span className="text-sm text-gray-500">
                                    {count}
                                  </span>
                                </div>
                              )
                            )}
                        </div>

                        <div>
                          <h3 className="text-sm font-medium mb-2">
                            Databases
                          </h3>
                          <Button
                            variant="link"
                            className="text-blue-600 p-0 h-auto text-sm mb-2"
                            onClick={() =>
                              setActiveFilters((prev) => ({
                                ...prev,
                                selectedDatabases: [],
                              }))
                            }
                          >
                            CLEAR ALL
                          </Button>
                          {resultStats &&
                            Object.entries(resultStats.databases)
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([db, count]) => (
                                <div
                                  key={db}
                                  className="flex items-center gap-2 mb-1"
                                >
                                  <Checkbox
                                    checked={activeFilters.selectedDatabases.includes(
                                      db
                                    )}
                                    onCheckedChange={(checked) => {
                                      setActiveFilters((prev) => ({
                                        ...prev,
                                        selectedDatabases: checked
                                          ? [...prev.selectedDatabases, db]
                                          : prev.selectedDatabases.filter(
                                              (d) => d !== db
                                            ),
                                      }));
                                    }}
                                  />
                                  <span className="text-sm flex-1">{db}</span>
                                  <span className="text-sm text-gray-500">
                                    {count}
                                  </span>
                                </div>
                              ))}
                        </div>

                        <div>
                          <h3 className="text-sm font-medium mb-2">
                            Date Between
                          </h3>
                          <div className="space-y-2">
                            <div>
                              <Label htmlFor="refine-start-date">
                                Start Date
                              </Label>
                              <Input
                                id="refine-start-date"
                                type="date"
                                value={activeFilters.dateRange.start}
                                onChange={(e) =>
                                  setActiveFilters((prev) => ({
                                    ...prev,
                                    dateRange: {
                                      ...prev.dateRange,
                                      start: e.target.value,
                                    },
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="refine-end-date">End Date</Label>
                              <Input
                                id="refine-end-date"
                                type="date"
                                value={activeFilters.dateRange.end}
                                onChange={(e) =>
                                  setActiveFilters((prev) => ({
                                    ...prev,
                                    dateRange: {
                                      ...prev.dateRange,
                                      end: e.target.value,
                                    },
                                  }))
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Results Table */}
              <div className="col-span-4">
                <div className="bg-gray-800 rounded-lg shadow">
                  <table className="w-full">
                    <thead className="bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Database
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Document Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Date <ArrowUpDown className="inline h-4 w-4" />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Answer
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredResults &&
                        sortResults(filteredResults.results).map(
                          (result, index) => (
                            <tr key={index} className="hover:bg-gray-700">
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    result.type === "legis"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {result.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-300">
                                {result.db}
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-100">
                                  <a
                                    href={`https://hklii.hk${result.path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-blue-400 hover:underline cursor-pointer"
                                  >
                                    {result.title}
                                  </a>
                                </div>
                                <div className="text-sm text-gray-400">
                                  {"subtitle" in result
                                    ? result.subtitle
                                    : `${result.neutral}; ${result.act}`}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-300">
                                {new Date(result.pub_date).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-300">
                                {answers[result.path] ? (
                                  <ReactMarkdown
                                    className="prose prose-invert prose-sm mt-1 w-full break-words prose-p:leading-relaxed prose-p:my-1"
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      a: (props) => (
                                        <a
                                          {...props}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-400 hover:text-blue-300 underline"
                                        />
                                      ),
                                      p: (props) => (
                                        <p
                                          {...props}
                                          className="mb-1 text-sm break-words"
                                        />
                                      ),
                                      h2: (props) => (
                                        <h2
                                          {...props}
                                          className="text-base font-semibold mb-1 mt-2"
                                        />
                                      ),
                                      blockquote: (props) => (
                                        <blockquote
                                          {...props}
                                          className="border-l-2 border-gray-600 pl-2 my-1 italic text-xs text-gray-400"
                                        />
                                      ),
                                      ul: (props) => (
                                        <ul
                                          {...props}
                                          className="list-disc list-inside mb-1 text-sm"
                                        />
                                      ),
                                      ol: (props) => (
                                        <ol
                                          {...props}
                                          className="list-decimal list-inside mb-1 text-sm"
                                        />
                                      ),
                                      li: (props) => (
                                        <li
                                          {...props}
                                          className="mb-0.5 text-sm"
                                        />
                                      ),
                                    }}
                                  >
                                    {answers[result.path]}
                                  </ReactMarkdown>
                                ) : (
                                  isAnswering && "Analyzing..."
                                )}
                              </td>
                            </tr>
                          )
                        )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center text-gray-300">
                  <div className="text-sm">
                    {filteredResults &&
                      `Showing 1-${Math.min(
                        parseInt(itemsPerPage),
                        filteredResults.count
                      )} of ${filteredResults.count}`}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled
                      className="text-gray-300 border-gray-700"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      className="text-gray-300 border-gray-700"
                    >
                      1
                    </Button>
                    <Button
                      variant="outline"
                      disabled
                      className="text-gray-300 border-gray-700"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
