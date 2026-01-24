import { NextResponse } from "next/server";
import { DATABASE_CATEGORIES } from "../../../constants/database-categories";

interface CaseResult {
  title: string;
  path: string;
  pub_date: string;
  db: string;
  act: string;
  neutral: string;
  parallel: string;
  coram: string;
  parties: string;
  charge: string;
  representations: string;
  remarks: string;
  type: "case";
}

interface LegislationResult {
  title: string;
  subtitle: string;
  path: string;
  pub_date: string;
  db: string;
  cap_version: string;
  type: "legis";
}

interface Database {
  id: string;
  label: string;
  dbId: number;
}

type SearchResult = CaseResult | LegislationResult;

interface SearchResponse {
  count: number;
  results: SearchResult[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Construct the HKLII API URL
    const hkliiUrl = new URL("https://hklii.hk/api/advancedsearch");
    
    // Add fixed parameters
    hkliiUrl.searchParams.set("searchType", "advanced");

    // Handle database selection
    const selectedDatabases = searchParams.get("selectedDatabases");
    if (selectedDatabases) {
      // Convert the comma-separated string of database IDs to an array
      const dbIds = selectedDatabases.split(",").map(id => {
        // Find the database in our categories and get its dbId
        for (const category of DATABASE_CATEGORIES) {
          const db = category.children.find(child => child.id === id);
          if (db) {
            return db.dbId;
          }
        }
        return null;
      }).filter(id => id !== null); // Remove any null values

      // Set the dbs parameter if we have selected databases
      if (dbIds.length > 0) {
        hkliiUrl.searchParams.set("dbs", dbIds.join(","));
      } else {
        // If no databases are selected, use the default set
        hkliiUrl.searchParams.set("dbs", "2,4,5,7,9,11,13,15,17,19,21,23,25,1,3,6,8,10,12,14,16,18,20,22,24");
      }
    } else {
      // If no databases parameter is provided, use the default set
      hkliiUrl.searchParams.set("dbs", "2,4,5,7,9,11,13,15,17,19,21,23,25,1,3,6,8,10,12,14,16,18,20,22,24");
    }
    
    // Map our search params to HKLII params
    const paramMapping: Record<string, string> = {
      citation: "citation",
      caseName: "title",
      legislationName: "captitle",
      partiesOfJudgment: "parties",
      coramOfJudgment: "coram",
      partiesRepresentation: "representation",
      charge: "charge",
      allOfTheseWords: "text",
      anyOfTheseWords: "anyword",
      exactPhrase: "phrase",
      startDate: "min_date",
      endDate: "max_date",
    };

    // Add all provided search params to the URL
    for (const [ourParam, hkliiParam] of Object.entries(paramMapping)) {
      const value = searchParams.get(ourParam);
      if (value) {
        // Format dates from YYYY-MM-DD to DD/MM/YYYY
        if (ourParam === "startDate" || ourParam === "endDate") {
          const date = new Date(value);
          const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
          hkliiUrl.searchParams.set(hkliiParam, formattedDate);
        } else {
          hkliiUrl.searchParams.set(hkliiParam, value);
        }
      }
    }

    console.log("HKLII Search URL:", hkliiUrl.toString());

    // Make the request to HKLII
    const response = await fetch(hkliiUrl.toString());
    const data = await response.json();

    // Transform the results to include the type
    const transformedResults = data.results.map((result: any) => {
      if (result.cap_version) {
        return {
          ...result,
          type: "legis" as const
        };
      }
      return {
        ...result,
        type: "case" as const
      };
    });

    return NextResponse.json({
      count: data.count,
      results: transformedResults
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
} 