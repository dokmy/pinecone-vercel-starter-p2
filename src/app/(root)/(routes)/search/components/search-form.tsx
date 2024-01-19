"use client";
import { useState } from "react";
import dayjs from "dayjs";
import courtTypes from "@/lib/constants";
import CourtOptions from "@/components/court-options";
import SearchQuery from "@/components/search-query";
import SearchPeriod from "@/components/search-period";
import SortBy from "@/components/sort-by";
import { Button } from "@mui/material";
import { performSearch } from "@/lib/performSearch";
import { useRouter } from "next/navigation";
import MoonLoader from "react-spinners/MoonLoader";

const SearchForm = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMinDate, setSelectedMinDate] = useState(dayjs("1991-07-11"));
  const [selectedMaxDate, setSelectedMaxDate] = useState(dayjs());
  const [cofa, setCofa] = useState<string[]>([]);
  const [coa, setCoa] = useState<string[]>([]);
  const [coficivil, setcoficivil] = useState<string[]>([]);
  const [coficriminal, setCoficriminal] = useState<string[]>([]);
  const [cofiprobate, setCofiprobate] = useState<string[]>([]);
  const [ct, setCt] = useState<string[]>([]);
  const [dc, setDc] = useState<string[]>([]);
  const [fc, setFc] = useState<string[]>([]);
  const [lt, setLt] = useState<string[]>([]);
  const [others, setOthers] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState("Relevance");

  const autocompleteFields = [
    {
      id: "courtOfFinalAppeal",
      label: "Court of Final Appeal",
      options: courtTypes.court_of_final_appeal,
      state: cofa,
      setState: setCofa,
    },
    {
      id: "courtOfAppeal",
      label: "Court of Appeal",
      options: courtTypes.court_of_appeal,
      state: coa,
      setState: setCoa,
    },
    {
      id: "courtOfFirstInstanceCivil",
      label: "Court of First Instance - Civil",
      options: courtTypes.court_of_first_instance_civil,
      state: coficivil,
      setState: setcoficivil,
    },
    {
      id: "courtOfFirstInstanceCriminal",
      label: "Court of First Instance - Criminal",
      options: courtTypes.court_of_first_instance_criminal,
      state: coficriminal,
      setState: setCoficriminal,
    },
    {
      id: "courtOfFirstInstanceProbate",
      label: "Court of First Instance - Probate",
      options: courtTypes.court_of_first_instance_probate,
      state: cofiprobate,
      setState: setCofiprobate,
    },
    {
      id: "competitionTribunal",
      label: "Competition Tribunal",
      options: courtTypes.competition_tribunal,
      state: ct,
      setState: setCt,
    },
    {
      id: "districtCourt",
      label: "District Court",
      options: courtTypes.district_court,
      state: dc,
      setState: setDc,
    },
    {
      id: "familyCourt",
      label: "Family Court",
      options: courtTypes.family_court,
      state: fc,
      setState: setFc,
    },
    {
      id: "landsTribunal",
      label: "Lands Tribunal",
      options: courtTypes.lands_tribunal,
      state: lt,
      setState: setLt,
    },
    {
      id: "courtOthers",
      label: "Other Courts",
      options: courtTypes.court_others,
      state: others,
      setState: setOthers,
    },
  ];

  const router = useRouter();

  const checkRequired = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("here");

    setIsLoading(true);

    let hasError = false;

    if (!searchQuery) {
      setSearchQueryError(true);
      hasError = true;
    }

    if (!hasError) {
      const filters = [
        ...cofa,
        ...coa,
        ...coficivil,
        ...coficriminal,
        ...cofiprobate,
        ...ct,
        ...dc,
        ...fc,
        ...lt,
        ...others,
      ];
      performSearch({
        filters,
        searchQuery,
        selectedMinDate,
        selectedMaxDate,
        sortOption,
      })
        .then(({ apiResults, searchId, noCredits }) => {
          if (noCredits) {
            alert("Not enough credits. Please upgrade or buy more.");
            router.push(`/settings`);
          } else {
            // router.refresh();
            router.push(`/results/${searchId}`);
          }
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error during search:", error);
          // Handle any errors that occurred during performSearch
          setIsLoading(false);
        });
    }
  };

  const [searchQueryError, setSearchQueryError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="w-full px-52 py-5 flex-col">
      <form onSubmit={checkRequired} noValidate autoComplete="off">
        <SearchQuery
          searchQueryError={searchQueryError}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <div className="mt-4 flex flex-wrap justify-between">
          {autocompleteFields.map((field) => (
            <div className="py-2 w-[49%]" key={field.id}>
              <CourtOptions
                key={field.id}
                id={field.id}
                label={field.label}
                options={field.options}
                state={field.state}
                setState={field.setState}
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-row justify-between">
          <SearchPeriod
            selectedMinDate={selectedMinDate}
            selectedMaxDate={selectedMaxDate}
            setSelectedMinDate={setSelectedMinDate}
            setSelectedMaxDate={setSelectedMaxDate}
          />
          <div>
            <SortBy sortOption={sortOption} setSortOption={setSortOption} />
          </div>
        </div>

        <div className="flex flex-row justify-center w-full">
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
            {isLoading ? (
              <MoonLoader
                color="#36d7b7"
                loading={isLoading}
                size={20} // Adjust size as needed
                aria-label="Loading Spinner"
                data-testid="loader"
              />
            ) : (
              "Search"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SearchForm;
