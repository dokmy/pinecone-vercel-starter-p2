import { Dayjs } from "dayjs";

export type CourtOption = {
  id: string;
  label: string;
  options?: string[];
};

export type SearchFormState = {
  query: string;
  countryOption: "hk" | "uk";
  dates: {
    min: Dayjs;
    max: Dayjs;
  };
  courts: {
    [courtType: string]: string[];
  };
  sortOption: "Relevance" | "Recency";
};

export type SearchPayload = {
  prefixFilters: string[];
  searchQuery: string;
  selectedMinDate: Dayjs;
  selectedMaxDate: Dayjs;
  sortOption: string;
  countryOption: string;
}; 