"use client";

import { useState, useCallback } from "react";
import { debounce } from "lodash";
import { Switch } from "@headlessui/react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onViewModeChange: (mode: "consolidated" | "detailed") => void;
  onFilterChange: (filters: any) => void;
}

export default function SearchBar({
  onSearch,
  onViewModeChange,
  onFilterChange,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isConsolidated, setIsConsolidated] = useState(true);

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      onSearch(value);
    }, 300),
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleViewModeChange = (checked: boolean) => {
    console.log(
      "SearchBar - View mode changing to:",
      checked ? "consolidated" : "detailed"
    );
    setIsConsolidated(checked);
    onViewModeChange(checked ? "consolidated" : "detailed");
  };

  const handleFilterChange = (filters: any) => {
    console.log("SearchBar - Selected t1_codes:", filters.t1Codes);
    onFilterChange(filters);
  };

  return (
    <div className="w-full max-w-4xl space-y-4">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search HKEX announcements..."
        className="w-full px-4 py-2 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="flex items-center space-x-2">
        <Switch
          checked={isConsolidated}
          onChange={handleViewModeChange}
          className={`${
            isConsolidated ? "bg-blue-600" : "bg-gray-200"
          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
        >
          <span className="sr-only">View Mode</span>
          <span
            className={`${
              isConsolidated ? "translate-x-6" : "translate-x-1"
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </Switch>
        <span className="text-sm text-gray-600">
          {isConsolidated ? "Consolidated View" : "Detailed View"}
        </span>
      </div>
    </div>
  );
}
