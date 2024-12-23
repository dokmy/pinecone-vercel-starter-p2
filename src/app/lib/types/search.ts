import { Dayjs } from "dayjs";

export type CountryOption = "hk" | "uk";
export type SortOption = "Relevance" | "Recency";

export type CourtOption = {
  id: string;
  label: string;
  options?: string[];
};

export type SearchFormState = {
  query: string;
  countryOption: CountryOption;
  dates: {
    min: Dayjs;
    max: Dayjs;
  };
  courts: {
    [courtType: string]: string[];
  };
  sortOption: SortOption;
};

export type SearchPayload = {
  prefixFilters: string[];
  searchQuery: string;
  selectedMinDate: Dayjs;
  selectedMaxDate: Dayjs;
  sortOption: SortOption;
  countryOption: CountryOption;
}; 