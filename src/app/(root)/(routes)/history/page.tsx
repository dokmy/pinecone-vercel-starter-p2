"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search } from "@prisma/client";
import { SearchResult } from "@prisma/client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import FastLegalLogo from "public/logo_rec.png";
import Link from "next/link";
import axios from "axios";
import { DataTable } from "../search/data-table";
import { columns } from "../search/columns";

type SearchWithResults = Search & { searchResults: SearchResult[] };

const HistoryPage = () => {
  const [searches, setSearches] = useState<null | SearchWithResults[]>(null);
  const { user } = useUser();

  useEffect(() => {
    const fetchSearches = async () => {
      if (user) {
        try {
          const response = await axios.post(`/api/get-searches`, {
            userId: user.id,
          });
          setSearches(response.data);
        } catch (error) {
          console.log("Error feteching searches: ", error);
        }
      }
    };
    fetchSearches();
  }, [user]);

  const formatPrefixFilters = (filters: string) => {
    if (filters == "[]") {
      return "No Filters";
    } else {
      filters = filters.replace(/[\[\]']+/g, "");
      return filters;
    }
  };

  const formatDate = (dateString: string | null | Date) => {
    // Check if dateString is not provided or is empty
    if (!dateString) {
      return "N/A";
    }

    // Try to parse the dateString into a Date object
    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "N/A";
    }

    // Format the date
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (searches == null) {
    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="animate-bounce justify-center items-center text-center">
          <Image
            src={FastLegalLogo}
            alt="fastlegal-logo"
            width="170"
            height="50"
            className="ml-3 my-1"
          />
          Loading searches...
        </div>
      </div>
    );
  }

  if (searches.length == 0) {
    return <div>No searches yet</div>;
  }

  let data: any[] = [];
  if (searches.length > 0) {
    data = searches.map((search) => {
      // process each createdAt, minDate, maxDate with formatDate function and process prefixFilters with formatPrefixFilters function. Lastly return the array of objects with the processed data
      return {
        query: search.query,
        url: search.id,
        createdAt: formatDate(search.createdAt),
        minDate: formatDate(search.minDate),
        maxDate: formatDate(search.maxDate),
        prefixFilters: formatPrefixFilters(search.prefixFilters),
        countryOption: search.countryOption,
        searchResults: search.searchResults,
        // searchResults: search.searchResults.map(
        //   (result) => result.caseNeutralCit
        // ),
      };
    });
  }

  return (
    <div className="flex flex-row flex-wrap gap-5 px-10 py-10 justify-center">
      <DataTable columns={columns} data={data} />

      {/* {searches.map((search, index) => (
        <div key={index} className="w-96 space-3 h-full">
          <Card className="w-full max-w-sm mx-auto bg-gray-800 text-white">
            <CardHeader>
              <CardTitle>{"Search " + (index + 1)}</CardTitle>
              <CardDescription>Your Search Settings:</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <div className="grid gap-2 border-2 border-gray-600 bg-[#1c204f] p-2 rounded-md">
                  <Label htmlFor="query">Search Query</Label>
                  <p className="text-sm text-gray-100" id="query">
                    {search.query}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 border-2 border-gray-600 bg-gray-700 p-2 rounded-md">
                <div className="grid gap-2">
                  <Label htmlFor="results">Search Results</Label>
                  <ul
                    className="list-disc list-inside text-sm text-gray-300"
                    id="results"
                  >
                    {search.searchResults.map((result, index) => (
                      <li key={index}>{result.caseActionNo}</li>
                    ))}
                  </ul>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="count">Number of Search Results</Label>
                  <p className="text-sm text-gray-300" id="count">
                    {search.searchResults.length} results
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="period">Search Period</Label>
                  <p className="text-sm text-gray-300" id="period">
                    {formatDate(search.minDate)} - {formatDate(search.maxDate)}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Search Date</Label>
                  <p className="text-sm text-gray-300" id="date">
                    {formatDate(search.createdAt)}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="filters">Search Filters</Label>
                  <p className="text-sm text-gray-300" id="filters">
                    {formatPrefixFilters(search.prefixFilters)}
                  </p>
                </div>
              </div>
            </CardContent>
            <div className="flex justify-center p-4">
              <Link href={`/results/${search.id}`}>
                <Button>Chat with Results</Button>
              </Link>
            </div>
          </Card>
        </div>
      ))} */}
    </div>
  );
};

export default HistoryPage;
