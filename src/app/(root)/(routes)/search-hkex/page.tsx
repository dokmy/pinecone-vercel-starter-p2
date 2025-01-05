"use client";

import { useState } from "react";
import SearchBar from "./components/SearchBar";
import FilterSection from "./components/FilterSection";
import ResultCard from "./components/ResultCard";
import Pagination from "./components/Pagination";
import { toast } from "sonner";

interface Filters {
  t1Codes: string[];
  stockCodes: string[];
  stockNames: string[];
  dateRange?: {
    start?: number;
    end?: number;
  };
  sortBy: "relevancy" | "recency";
  viewMode: "consolidated" | "detailed";
}

export default function SearchHKEX() {
  const [results, setResults] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");
  const [currentFilters, setCurrentFilters] = useState<Filters>({
    t1Codes: [],
    stockCodes: [],
    stockNames: [],
    sortBy: "relevancy",
    viewMode: "consolidated",
  });
  const [facets, setFacets] = useState<any>(null);

  const performSearchWithFilters = async (
    page: number,
    searchQuery: string,
    filters: Filters
  ) => {
    setIsLoading(true);
    try {
      const searchParams = {
        query: searchQuery,
        page,
        ...filters,
      };

      console.log("Page - Performing search with params:", searchParams);

      const response = await fetch("/api/search-hkex", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchParams),
      });

      if (response.status === 403) {
        toast("Not enough credits. Please upgrade or buy more.");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Search API error:", errorData);
        throw new Error(
          `Search failed: ${errorData.error || response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Page - Raw API response:", data);

      setResults(data.hits || []);
      setFacets(data.facets || {});
      setTotalPages(Math.ceil(data.found / 10));
      setCurrentPage(page);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
      setFacets(null);
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = (page = 1, searchQuery?: string) => {
    const queryToUse = searchQuery ?? currentQuery;
    performSearchWithFilters(page, queryToUse, currentFilters);
  };

  const handleSearch = (query: string) => {
    console.log("Page - handleSearch called with:", query);
    setCurrentQuery(query);
    setCurrentPage(1);
    performSearch(1, query);
  };

  const handleFilterChange = (filters: any) => {
    console.log("Page - handleFilterChange called with:", filters);
    const newFilters = {
      ...filters,
      viewMode: currentFilters.viewMode,
    };

    console.log("Page - New filters being applied:", newFilters);
    setCurrentFilters(newFilters);
    setCurrentPage(1);
    performSearchWithFilters(1, currentQuery, newFilters);
  };

  const handlePageChange = (page: number) => {
    performSearch(page);
  };

  const handleViewModeChange = (mode: "consolidated" | "detailed") => {
    console.log("Page - View mode changing to:", mode);
    setCurrentFilters((prev) => {
      const newFilters = { ...prev, viewMode: mode };
      console.log("Page - New filters:", newFilters);
      performSearchWithFilters(1, currentQuery, newFilters);
      return newFilters;
    });
  };

  return (
    <div className="flex min-h-screen">
      <FilterSection
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onViewModeChange={handleViewModeChange}
        facets={facets}
      />

      <main className="flex-1 p-8">
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : results.length > 0 ? (
            <>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <ResultCard
                    key={`${result.document.NEWS_ID}-${index}`}
                    result={result}
                  />
                ))}
              </div>

              {results.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          ) : (
            <div className="flex justify-center mt-4">
              <div className="space-y-6 max-w-3xl">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                  <h2 className="text-xl font-semibold mb-4">
                    Welcome to HKEX Announcements Search
                  </h2>
                  <p className="text-gray-300 mb-4">
                    Start searching by typing in the search bar. You can use
                    these powerful search operators:
                  </p>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-blue-400 mb-2">
                        Exact Phrase Search
                      </h3>
                      <code className="bg-gray-700 px-2 py-1 rounded">
                        "annual report"
                      </code>
                      <p className="text-sm text-gray-400 mt-1">
                        Use quotes to find exact phrases
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-blue-400 mb-2">
                        Boolean Operators
                      </h3>
                      <code className="bg-gray-700 px-2 py-1 rounded">
                        dividend && bonus
                      </code>
                      <p className="text-sm text-gray-400 mt-1">
                        Use && (AND) and || (OR) to combine terms
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-blue-400 mb-2">
                        Exclude Terms
                      </h3>
                      <code className="bg-gray-700 px-2 py-1 rounded">
                        announcement -interim
                      </code>
                      <p className="text-sm text-gray-400 mt-1">
                        Use - to exclude terms from results
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-blue-400 mb-2">
                        Field-Specific Search
                      </h3>
                      <code className="bg-gray-700 px-2 py-1 rounded">
                        STOCK_CODE:700 || TITLE:"Annual Results"
                      </code>
                      <p className="text-sm text-gray-400 mt-1">
                        Search in specific fields: TITLE:, STOCK_CODE:,
                        STOCK_NAME:, or chunk_text:
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-blue-400 mb-2">
                        Optional Terms
                      </h3>
                      <code className="bg-gray-700 px-2 py-1 rounded">
                        announcement~ dividend~
                      </code>
                      <p className="text-sm text-gray-400 mt-1">
                        Add ~ after terms to make them optional
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-blue-400 mb-2">
                        Complex Queries
                      </h3>
                      <code className="bg-gray-700 px-2 py-1 rounded">
                        (STOCK_CODE:700 || STOCK_CODE:388) && "annual report"
                        -interim
                      </code>
                      <p className="text-sm text-gray-400 mt-1">
                        Combine operators for more precise searches
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
