"use client";

import { Button } from "@mui/material";
import SearchQuery from "@/components/search-query";
import SearchPeriod from "@/components/search-period";
import SortBy from "@/components/sort-by";
import CourtOptions from "@/components/court-options";
import { HK_COURT_OPTIONS } from "@/lib/config/court-options";
import { useSearchForm } from "../../../../lib/hooks/useSearchForm";
import { CourtOption, SortOption } from "@/lib/types/search";
import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { Dayjs } from "dayjs";
import { toast } from "sonner";

interface SearchFormProps {
  LoadingStateComponent: React.ComponentType<{ message: string }>;
}

const SearchForm: React.FC<SearchFormProps> = ({ LoadingStateComponent }) => {
  const [loadingMessage, setLoadingMessage] = useState("Searching...");
  const {
    state,
    isLoading,
    setIsLoading,
    hasError,
    setHasError,
    updateField,
    updateCourt,
  } = useSearchForm();

  // Create wrapped update functions that match React's setState type
  const setSearchQuery: Dispatch<SetStateAction<string>> = useCallback(
    (value) =>
      updateField(
        "query",
        typeof value === "function" ? value(state.query) : value
      ),
    [updateField, state.query]
  );

  const setSortOption: Dispatch<SetStateAction<SortOption>> = useCallback(
    (value) =>
      updateField(
        "sortOption",
        typeof value === "function" ? value(state.sortOption) : value
      ),
    [updateField, state.sortOption]
  );

  const setCourtState = useCallback(
    (courtId: string): Dispatch<SetStateAction<string[]>> =>
      (value) => {
        const newValue =
          typeof value === "function"
            ? value(state.courts[courtId] || [])
            : value;
        updateCourt(courtId, newValue);
      },
    [state.courts, updateCourt]
  );

  const setDate = useCallback(
    (type: "min" | "max"): Dispatch<SetStateAction<Dayjs>> =>
      (value) => {
        const newValue =
          typeof value === "function" ? value(state.dates[type]) : value;
        updateField("dates", { ...state.dates, [type]: newValue });
      },
    [state.dates, updateField]
  );

  const validateForm = (): boolean => {
    if (!state.query) {
      setHasError(true);
      return false;
    }
    return true;
  };

  const getAllCourtFilters = (): string[] => {
    return Object.values(state.courts).flat();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadingMessage("Validating your request...");

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        prefixFilters: getAllCourtFilters(),
        searchQuery: state.query,
        selectedMinDate: state.dates.min,
        selectedMaxDate: state.dates.max,
        sortOption: state.sortOption,
        countryOption: "hk",
      };

      setLoadingMessage("Searching through case law database...");
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 403) {
        toast("Not enough credits. Please upgrade or buy more.");
        window.location.href = "/settings";
        return;
      }

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      setLoadingMessage("Processing results...");
      const data = await response.json();
      window.location.replace(`/results/${data.searchId}`);
    } catch (error) {
      console.error("Search error:", error);
      setHasError(true);
      toast.error("Search failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-12 lg:px-52 py-5 flex-col">
      {isLoading && <LoadingStateComponent message={loadingMessage} />}
      <form onSubmit={handleSubmit} noValidate autoComplete="off">
        <SearchQuery
          searchQueryError={hasError}
          searchQuery={state.query}
          setSearchQuery={setSearchQuery}
        />

        <div className="mt-4 flex flex-wrap justify-between">
          {HK_COURT_OPTIONS.map((field: CourtOption) => (
            <div className="py-2 w-full sm:w-[49%]" key={field.id}>
              <CourtOptions
                key={field.id}
                id={field.id}
                label={field.label}
                options={field.options || []}
                state={state.courts[field.id] || []}
                setState={setCourtState(field.id)}
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col items-center py-2 w-full">
          <SearchPeriod
            selectedMinDate={state.dates.min}
            selectedMaxDate={state.dates.max}
            setSelectedMinDate={setDate("min")}
            setSelectedMaxDate={setDate("max")}
          />
          <SortBy sortOption={state.sortOption} setSortOption={setSortOption} />
        </div>

        <div className="flex flex-row justify-center mt-4 w-full">
          <Button
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{
              bgcolor: "black",
              borderColor: "grey",
              border: 1,
              "&:hover": { bgcolor: "grey", borderColor: "white", border: 1 },
              width: 200,
            }}
            type="submit"
          >
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SearchForm;
