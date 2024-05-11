"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Search } from "@prisma/client";
import { SearchResult } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { GB } from "country-flag-icons/react/3x2";
import { HK } from "country-flag-icons/react/3x2";
import Link from "next/link";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type SearchWithResults = Search & { searchResults: SearchResult[] };

export const columns: ColumnDef<SearchWithResults>[] = [
  {
    accessorKey: "createdAt",
    header: "Search Date",
  },
  {
    accessorKey: "query",
    header: "Query",
  },
  {
    accessorKey: "prefixFilters",
    header: "Prefix Filters",
  },
  {
    accessorKey: "countryOption",
    header: "Country",
    cell: (row) => {
      const countryOption = row.getValue();
      if (countryOption === "hk") {
        return <HK />;
      } else {
        return <GB />;
      }
    },
  },
  {
    accessorKey: "searchResults",
    header: "Results",
    cell: (row) => {
      const searchResults: SearchResult[] = row.getValue();
      const results_list = searchResults.map((result) => result.caseNeutralCit);
      const first_three = results_list.slice(0, 3);
      return first_three.map((result) => (
        <ul key={result}>
          <li>{result}</li>
        </ul>
      ));
    },
  },
  {
    accessorKey: "minDate",
    header: "Min Date",
  },
  {
    accessorKey: "maxDate",
    header: "Max Date",
  },
  {
    accessorKey: "url",
    header: "Go to Result",
    cell: (row) => {
      const searchId = row.getValue();
      const path = `/results/${searchId}`;
      return (
        <Button>
          <Link href={path}>Go to Result</Link>
        </Button>
      );
    },
  },
];
