"use client";
import { useState } from "react";
import dayjs from "dayjs";
import courtTypes from "@/lib/constants";
import CourtOptions from "@/components/court-options";
import SearchQuery from "@/components/search-query";
import SearchPeriod from "@/components/search-period";
import SortBy from "@/components/sort-by";
import ChooseCountry from "@/components/choose-country";
import { Button } from "@mui/material";
import { performSearch } from "@/lib/performSearch";
import { useRouter } from "next/navigation";
import MoonLoader from "react-spinners/MoonLoader";
import { Hammer } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [countryOption, setCountryOption] = useState("hk");
  const [ukCourts, setUkCourts] = useState<string[]>([]);

  const hk_autocompleteFields = [
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

  const ukCourtOptions = [
    {
      id: "Upper Tribunal (Administrative Appeals Chamber)",
      label: "Upper Tribunal (Administrative Appeals Chamber)",
    },
    {
      id: "United Kingdom Upper Tribunal (Tax and Chancery Chamber)",
      label: "United Kingdom Upper Tribunal (Tax and Chancery Chamber)",
    },
    {
      id: "Upper Tribunal (Immigration and Asylum Chamber)",
      label: "Upper Tribunal (Immigration and Asylum Chamber)",
    },
    {
      id: "United Kingdom Upper Tribunal (Lands Chamber)",
      label: "United Kingdom Upper Tribunal (Lands Chamber)",
    },
    {
      id: "First-tier Tribunal (General Regulatory Chamber)",
      label: "First-tier Tribunal (General Regulatory Chamber)",
    },
    {
      id: "First-tier Tribunal (Health Education and Social Care Chamber)",
      label: "First-tier Tribunal (Health Education and Social Care Chamber)",
    },
    {
      id: "First-tier Tribunal (Property Chamber)",
      label: "First-tier Tribunal (Property Chamber)",
    },
    {
      id: "First-tier Tribunal (Tax)",
      label: "First-tier Tribunal (Tax)",
    },
    {
      id: "United Kingdom Competition Appeals Tribunal",
      label: "United Kingdom Competition Appeals Tribunal",
    },
    {
      id: "Nominet UK Dispute Resolution Service",
      label: "Nominet UK Dispute Resolution Service",
    },
    {
      id: "Special Immigrations Appeals Commission",
      label: "Special Immigrations Appeals Commission",
    },
    {
      id: "United Kingdom Employment Appeal Tribunal",
      label: "United Kingdom Employment Appeal Tribunal",
    },
    {
      id: "United Kingdom Employment Tribunal",
      label: "United Kingdom Employment Tribunal",
    },
    {
      id: "United Kingdom Financial Services and Markets Tribunals Decisions",
      label:
        "United Kingdom Financial Services and Markets Tribunals Decisions",
    },
    {
      id: "United Kingdom Asylum and Immigration Tribunal",
      label: "United Kingdom Asylum and Immigration Tribunal",
    },
    {
      id: "United Kingdom Immigration and Asylum (AIT/IAC) Unreported Judgments",
      label:
        "United Kingdom Immigration and Asylum (AIT/IAC) Unreported Judgments",
    },
    {
      id: "United Kingdom Information Tribunal including the National Security Appeals Panel",
      label:
        "United Kingdom Information Tribunal including the National Security Appeals Panel",
    },
    {
      id: "United Kingdom Special Commissioners of Income Tax Decisions",
      label: "United Kingdom Special Commissioners of Income Tax Decisions",
    },
    {
      id: "UK Social Security and Child Support Commissioners' Decisions",
      label: "UK Social Security and Child Support Commissioners' Decisions",
    },
    {
      id: "United Kingdom VAT & Duties Tribunals Decisions",
      label: "United Kingdom VAT & Duties Tribunals Decisions",
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
        ...ukCourts,
      ];
      performSearch({
        filters,
        searchQuery,
        selectedMinDate,
        selectedMaxDate,
        sortOption,
        countryOption,
      })
        .then(({ apiResults, searchId, noCredits }) => {
          if (noCredits) {
            toast("Not enough credits. Please upgrade or buy more.");
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
    <div className="px-12 lg:px-52 py-5 flex-col">
      <form onSubmit={checkRequired} noValidate autoComplete="off">
        <SearchQuery
          searchQueryError={searchQueryError}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <div className="mt-4 flex flex-col items-center w-full">
          <ChooseCountry
            countryOption={countryOption}
            setCountryOption={setCountryOption}
          />
        </div>

        <div className="mt-4 flex flex-wrap justify-between">
          {countryOption === "hk"
            ? hk_autocompleteFields.map((field) => (
                <div className="py-2 w-full sm:w-[49%]" key={field.id}>
                  <CourtOptions
                    key={field.id}
                    id={field.id}
                    label={field.label}
                    options={field.options}
                    state={field.state}
                    setState={field.setState}
                  />
                </div>
              ))
            : ukCourtOptions.map((field) => (
                <div
                  className="py-2 flex flex-row space-x-2 w-full sm:w-[49%]"
                  key={field.id}
                >
                  <Checkbox
                    id={field.id}
                    checked={ukCourts.includes(field.id)}
                    onCheckedChange={(checked) =>
                      setUkCourts((prevCourts) =>
                        checked
                          ? [...prevCourts, field.id]
                          : prevCourts.filter((court) => court !== field.id)
                      )
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor={field.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {field.label}
                    </label>
                  </div>
                </div>
              ))}
        </div>

        <div className="mt-4 flex flex-col items-center py-2 w-full">
          <SearchPeriod
            selectedMinDate={selectedMinDate}
            selectedMaxDate={selectedMaxDate}
            setSelectedMinDate={setSelectedMinDate}
            setSelectedMaxDate={setSelectedMaxDate}
          />
          <SortBy sortOption={sortOption} setSortOption={setSortOption} />
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
