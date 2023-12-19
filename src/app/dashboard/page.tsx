"use client";

import React, { useEffect, useRef, useState, FormEvent } from "react";
import Header from "@/components/Header";
import Chat from "@/components/Chat";
import { useChat } from "ai/react";
import InstructionModal from "@/components/InstructionModal";
import { AiFillGithub, AiOutlineInfoCircle } from "react-icons/ai";
import Search from "@/components/Search";
import dayjs from "dayjs";
import { url } from "inspector";
import { Button } from "@mui/material";

interface search_result {
  raw_case_num: string;
  case_title: string;
  case_date: string;
  case_court: string;
  case_neutral_cit: string;
  case_action_no: string;
  url: string;
}

const Page: React.FC = () => {
  const [isModalOpen, setModalOpen] = useState(false);
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
  const [filteredResults, setFilteredResults] = useState<search_result[]>([]);
  const [resultsShown, setResultsShown] = useState<number>(3);

  const performSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent the default form submission behavior
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
    console.log(
      "Search performed with query:",
      searchQuery,
      selectedMinDate.format("MM/DD/YYYY"),
      selectedMaxDate.format("MM/DD/YYYY"),
      filters,
      sortOption
    );
    searchApi(searchQuery, filters);
  };

  async function searchApi(searchQuery: string, filters: string[]) {
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ searchQuery, filters }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      const deduplicatedResults = data.deduplicatedResults;
      console.log("API results:", deduplicatedResults);

      const filteredResults = deduplicatedResults.filter(
        (result: search_result) => {
          const caseDate = dayjs(result.case_date);
          return (
            (caseDate.isSame(selectedMinDate) ||
              caseDate.isAfter(selectedMinDate)) &&
            (caseDate.isSame(selectedMaxDate) ||
              caseDate.isBefore(selectedMaxDate))
          );
        }
      );
      console.log("Length of API data: ", deduplicatedResults.length);
      console.log("Filtered results: ", filteredResults);

      if (sortOption === "Recency") {
        filteredResults.sort((a: search_result, b: search_result) => {
          // Convert case_date strings to Day.js objects for comparison
          const dateA = dayjs(a.case_date);
          const dateB = dayjs(b.case_date);

          // Sort in descending order
          return dateB.diff(dateA);
        });
      }
      console.log("sory by ", filteredResults);

      setFilteredResults(filteredResults);
    } catch (error) {
      console.error(
        "Error during API call:",
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      throw error;
    }
  }

  console.log("Here is the filteredResults: ", filteredResults);

  return (
    <div className="flex flex-col justify-between h-screen bg-black  mx-auto max-w-full">
      <Header
        filteredResults={filteredResults}
        resultsShown={resultsShown}
        setResultsShown={setResultsShown}
      />
      <div className="flex w-full flex-grow overflow-hidden relative">
        <div className="w-1/4 min-w-[20%] p-2 border-r border-slate-400">
          <Search
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedMinDate={selectedMinDate}
            setSelectedMinDate={setSelectedMinDate}
            selectedMaxDate={selectedMaxDate}
            setSelectedMaxDate={setSelectedMaxDate}
            cofa={cofa}
            setCofa={setCofa}
            coa={coa}
            setCoa={setCoa}
            coficivil={coficivil}
            setcoficivil={setcoficivil}
            coficriminal={coficriminal}
            setCoficriminal={setCoficriminal}
            cofiprobate={cofiprobate}
            setCofiprobate={setCofiprobate}
            ct={ct}
            setCt={setCt}
            dc={dc}
            setDc={setDc}
            fc={fc}
            setFc={setFc}
            lt={lt}
            setLt={setLt}
            others={others}
            setOthers={setOthers}
            sortOption={sortOption}
            setSortOption={setSortOption}
            performSearch={performSearch}
          />
        </div>
        <div className="flex flex-row overflow-x-auto">
          {filteredResults.slice(0, resultsShown).map((result, index) => (
            <div
              key={`${index}-${result.raw_case_num}`}
              className="w-2/5 border border-slate-400 min-w-[33%]"
            >
              <Chat
                raw_case_num={result.raw_case_num}
                query={searchQuery}
                case_date={dayjs(result.case_date).format("DD MMM, YYYY")}
                case_action_no={result.case_action_no}
                case_neutral_cit={result.case_neutral_cit}
                url={result.url}
                case_title={result.case_title}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Page;
