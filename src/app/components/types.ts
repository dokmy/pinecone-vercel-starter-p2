import { Dispatch, SetStateAction } from "react";
import { Dayjs } from "dayjs";
import { SortOption } from "@/lib/types/search";

export interface SearchQueryProps {
  searchQueryError: boolean;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
}

export interface SearchPeriodProps {
  selectedMinDate: Dayjs;
  selectedMaxDate: Dayjs;
  setSelectedMinDate: Dispatch<SetStateAction<Dayjs>>;
  setSelectedMaxDate: Dispatch<SetStateAction<Dayjs>>;
}

export interface SortByProps {
  sortOption: SortOption;
  setSortOption: Dispatch<SetStateAction<SortOption>>;
}

export interface CourtOptionsProps {
  id: string;
  label: string;
  options: string[];
  state: string[];
  setState: Dispatch<SetStateAction<string[]>>;
} 