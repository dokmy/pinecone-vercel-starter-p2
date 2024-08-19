"use client";
import React, { useState, useEffect } from "react";
import ChatComponent from "./2-chat-component";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import axios from "axios";

interface SearchResult {
  id: string;
  caseName: string;
  caseNeutralCit: string;
  caseActionNo: string;
  caseDate: Date; // or string, if you are using ISO date strings
  caseUrl: string;
  createdAt: Date; // or string, for ISO date strings
  searchId: string;
  userId: string;
}

const ChatComponentsWrapper = ({
  searchResults,
  searchMetadataQuery,
  searchId,
  searchCountryOption,
  outputLanguage,
}: {
  searchResults: SearchResult[];
  searchMetadataQuery: string;
  searchId: string;
  searchCountryOption: string;
  outputLanguage: string;
}) => {
  const [casesShown, setCasesShown] = useState(3);

  const addCasesShown = () => {
    if (casesShown < searchResults.length) {
      const newCasesShown = casesShown + 1;
      setCasesShown(newCasesShown);
    }
  };

  useEffect(() => {
    const getResultsShwon = async () => {
      try {
        const response = await axios.post(`/api/get-results-shown`, {
          searchId: searchId,
        });
        setCasesShown(response.data);
      } catch (error) {
        console.log("Error getting results shown: ", error);
      }
    };
    getResultsShwon();
  }, []);

  useEffect(() => {
    const updateResultsShown = async () => {
      try {
        const response = await fetch("/api/update-results-shown", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ searchId, casesShown }),
        });

        if (response.ok) {
          console.log("Update successful", casesShown);
        } else {
          console.error("Update failed", await response.text());
        }
      } catch (error) {
        console.error("Error updating results shown:", error);
      }
    };

    updateResultsShown();
  }, [casesShown]);

  return (
    <div className="flex flex-col w-full">
      <div className="w-full flex flex-col text-sm space-y-2 md:flex-row border-b py-3 px-5 justify-between items-center text-center">
        <div>
          <h1>Query: </h1>
          {searchMetadataQuery.substring(0, 70) + "..."}
        </div>
        <div>
          <h1>Cases Retrieved:</h1>
          {searchResults.length}
        </div>
        <div>
          <h1>Cases Shown:</h1>
          {casesShown}
        </div>
        <Button variant="outline" onClick={addCasesShown}>
          <Plus className="mr-2 h-4 w-4"></Plus>
          Add one more case
        </Button>
      </div>
      <div className="flex flex-col w-full">
        {searchResults.slice(0, casesShown).map((result) => (
          <div key={result.id} className="rounded-lg p-3">
            <ChatComponent
              data={result}
              query={searchMetadataQuery}
              countryOption={searchCountryOption}
              outputLanguage={outputLanguage}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatComponentsWrapper;
