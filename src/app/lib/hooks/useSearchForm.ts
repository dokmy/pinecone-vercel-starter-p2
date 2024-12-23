import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import dayjs from "dayjs";
import { SearchFormState, SearchPayload } from "../../lib/types/search";

const DEFAULT_STATE: SearchFormState = {
  query: "",
  countryOption: "hk",
  dates: {
    min: dayjs("1991-07-11"),
    max: dayjs(),
  },
  courts: {
    cofa: [],
    coa: [],
    coficivil: [],
    coficriminal: [],
    cofiprobate: [],
    ct: [],
    dc: [],
    fc: [],
    lt: [],
    others: [],
    ukCourts: [],
  },
  sortOption: "Relevance",
};

export const useSearchForm = () => {
  const router = useRouter();
  const [state, setState] = useState<SearchFormState>(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const updateField = <K extends keyof SearchFormState>(
    field: K,
    value: SearchFormState[K]
  ) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const updateCourt = (courtType: string, value: string[]) => {
    setState((prev) => ({
      ...prev,
      courts: { ...prev.courts, [courtType]: value },
    }));
  };

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
    setHasError(false);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const payload: SearchPayload = {
        prefixFilters: getAllCourtFilters(),
        searchQuery: state.query,
        selectedMinDate: state.dates.min,
        selectedMaxDate: state.dates.max,
        sortOption: state.sortOption,
        countryOption: state.countryOption,
      };

      console.log('Sending search payload:', payload);

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

      const data = await response.json();
      console.log('Received response data:', data);
      
      // Force navigation with window.location.replace
      const redirectUrl = `/results2/${data.searchId}`;
      console.log('Forcing navigation to:', redirectUrl);
      window.location.replace(redirectUrl);

    } catch (error) {
      console.error("Search error:", error);
      setHasError(true);
      toast.error("Search failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    state,
    isLoading,
    hasError,
    updateField,
    updateCourt,
    handleSubmit,
  };
}; 