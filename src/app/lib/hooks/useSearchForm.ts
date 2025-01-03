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

  return {
    state,
    isLoading,
    setIsLoading,
    hasError,
    setHasError,
    updateField,
    updateCourt,
  };
}; 