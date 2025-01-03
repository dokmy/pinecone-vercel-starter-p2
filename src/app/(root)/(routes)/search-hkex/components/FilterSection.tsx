"use client";

import { useState, useCallback } from "react";
import { Listbox } from "@headlessui/react";
import dynamic from "next/dynamic";
import t1codesData from "../data/t1codes.json";
import SearchBar from "./SearchBar";
import type { ComponentType } from "react";

// Dynamic import for DatePicker with no SSR
const ReactDatePicker = dynamic(() => import("react-datepicker"), {
  ssr: false,
}) as ComponentType<any>;

// Remove the type assertion since we properly typed it above
const DatePicker = ReactDatePicker;

// Import styles in a way that works with SSR
import "react-datepicker/dist/react-datepicker.css";

interface FilterState {
  t1Codes: string[];
  stockCodes: string[];
  stockNames: string[];
  dateRange: {
    start?: number;
    end?: number;
  };
  sortBy: "relevancy" | "recency";
}

interface FilterSectionProps {
  onFilterChange: (filters: FilterState) => void;
  onSearch: (query: string) => void;
  onViewModeChange: (mode: "consolidated" | "detailed") => void;
  facets?: {
    STOCK_CODE?: Array<{ value: string; count: number }>;
    STOCK_NAME?: Array<{ value: string; count: number }>;
  };
}

export default function FilterSection({
  onFilterChange,
  onSearch,
  onViewModeChange,
  facets,
}: FilterSectionProps) {
  const [selectedT1Codes, setSelectedT1Codes] = useState<string[]>([]);
  const [selectedStockCodes, setSelectedStockCodes] = useState<string[]>([]);
  const [selectedStockNames, setSelectedStockNames] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState<"relevancy" | "recency">("relevancy");

  const handleFilterChange = useCallback(
    (updates: Partial<FilterState> = {}) => {
      const currentFilters: FilterState = {
        t1Codes: selectedT1Codes,
        stockCodes: selectedStockCodes,
        stockNames: selectedStockNames,
        dateRange: {
          start: startDate?.getTime(),
          end: endDate?.getTime(),
        },
        sortBy,
      };
      const newFilters = { ...currentFilters, ...updates };
      console.log("FilterSection - Sending filters:", newFilters);
      onFilterChange(newFilters);
    },
    [
      selectedT1Codes,
      selectedStockCodes,
      selectedStockNames,
      startDate,
      endDate,
      sortBy,
      onFilterChange,
    ]
  );

  const handleT1CodesChange = (codes: string[]) => {
    console.log("FilterSection - T1 codes selected:", codes);
    setSelectedT1Codes(codes);
    handleFilterChange({ t1Codes: codes });
  };

  const ChevronUpDownIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 text-gray-400"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M10 3a.75.75 0 01.75.75v10.5a.75.75 0 01-1.5 0V3.75A.75.75 0 0110 3zm-7.5 4a.75.75 0 01.75-.75h13.5a.75.75 0 010 1.5H3.25a.75.75 0 01-.75-.75z"
        clipRule="evenodd"
      />
    </svg>
  );

  const CheckIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 text-blue-600"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );

  // Wrap DatePicker in a client-only div
  const DatePickerWrapper = ({ selected, onChange, placeholderText }: any) => (
    <div suppressHydrationWarning>
      <DatePicker
        selected={selected}
        onChange={onChange}
        placeholderText={placeholderText}
        className="w-full px-3 py-2 border rounded-md bg-transparent"
      />
    </div>
  );

  return (
    <div className="w-64 p-4 border-r min-h-screen">
      <SearchBar
        onSearch={onSearch}
        onViewModeChange={onViewModeChange}
        onFilterChange={onFilterChange}
      />

      <h2 className="text-lg font-semibold mb-4 mt-6">Filters</h2>

      <div className="space-y-6">
        {/* Document Types */}
        <div className="space-y-2">
          <label className="block text-sm">Document Types</label>
          <Listbox
            value={selectedT1Codes}
            onChange={handleT1CodesChange}
            multiple
          >
            <div className="relative mt-1">
              <Listbox.Button className="relative w-full py-2 pl-3 pr-10 text-left rounded-lg border">
                {selectedT1Codes.length === 0 ? (
                  "Select document types"
                ) : (
                  <span className="block truncate">
                    {selectedT1Codes
                      .map(
                        (code) =>
                          t1codesData.codes.find((c) => c.code === code)?.name
                      )
                      .join(", ")}
                  </span>
                )}
                <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon />
                </span>
              </Listbox.Button>
              <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md py-1 text-base shadow-lg ring-1 ring-opacity-5 focus:outline-none sm:text-sm bg-black border border-gray-700">
                {t1codesData.codes.map((t1code) => (
                  <Listbox.Option
                    key={t1code.code}
                    value={t1code.code}
                    className={({ active, selected }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? "bg-gray-700" : "bg-black"
                      } ${selected ? "font-medium" : ""}`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {t1code.name}
                        </span>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <CheckIcon />
                          </span>
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>

        {/* Stock Code Facets */}
        <div className="space-y-2">
          <label className="block text-sm">Stock Code</label>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {facets?.STOCK_CODE?.map(({ value, count }) => (
              <label key={value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedStockCodes.includes(value)}
                  onChange={(e) => {
                    const newCodes = e.target.checked
                      ? [...selectedStockCodes, value]
                      : selectedStockCodes.filter((code) => code !== value);
                    setSelectedStockCodes(newCodes);
                    handleFilterChange({ stockCodes: newCodes });
                  }}
                  className="rounded border-gray-300"
                />
                <span>{value}</span>
                <span className="text-sm text-gray-500">({count})</span>
              </label>
            ))}
          </div>
        </div>

        {/* Stock Name Facets */}
        <div className="space-y-2">
          <label className="block text-sm">Stock Name</label>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {facets?.STOCK_NAME?.map(({ value, count }) => (
              <label key={value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedStockNames.includes(value)}
                  onChange={(e) => {
                    const newNames = e.target.checked
                      ? [...selectedStockNames, value]
                      : selectedStockNames.filter((name) => name !== value);
                    setSelectedStockNames(newNames);
                    handleFilterChange({ stockNames: newNames });
                  }}
                  className="rounded border-gray-300"
                />
                <span>{value}</span>
                <span className="text-sm text-gray-500">({count})</span>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <label className="block text-sm">Date Range</label>
          <div className="space-y-2">
            <DatePickerWrapper
              selected={startDate}
              onChange={(date: Date | null) => {
                setStartDate(date);
                handleFilterChange({
                  dateRange: {
                    start: date?.getTime(),
                    end: endDate?.getTime(),
                  },
                });
              }}
              placeholderText="Start Date"
            />
            <DatePickerWrapper
              selected={endDate}
              onChange={(date: Date | null) => {
                setEndDate(date);
                handleFilterChange({
                  dateRange: {
                    start: startDate?.getTime(),
                    end: date?.getTime(),
                  },
                });
              }}
              placeholderText="End Date"
            />
          </div>
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <label className="block text-sm">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => {
              const newSortBy = e.target.value as "relevancy" | "recency";
              setSortBy(newSortBy);
              handleFilterChange({ sortBy: newSortBy });
            }}
            className="w-full px-3 py-2 border rounded-md bg-transparent"
          >
            <option value="relevancy">Sort by Relevance</option>
            <option value="recency">Sort by Date</option>
          </select>
        </div>
      </div>
    </div>
  );
}
