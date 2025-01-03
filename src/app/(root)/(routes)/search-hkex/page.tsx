"use client";

import { useState } from "react";
import SearchBar from "./components/SearchBar";
import FilterSection from "./components/FilterSection";
import ResultCard from "./components/ResultCard";
import Pagination from "./components/Pagination";

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
        <h1 className="text-3xl font-bold mb-8">Search HKEX Announcements</h1>

        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
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
          )}
        </div>
      </main>
    </div>
  );
}
