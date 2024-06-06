import dayjs from "dayjs";
import { toast } from "sonner";

interface PerformSearchProps {
    prefixFilters: string[]
    searchQuery: string
    selectedMinDate: dayjs.Dayjs
    selectedMaxDate: dayjs.Dayjs
    sortOption: string
    countryOption: string
}

interface search_result {
    raw_case_num: string;
    case_title: string;
    case_date: string;
    case_court: string;
    case_neutral_cit: string;
    case_action_no: string;
    url: string;
  }



export async function performSearch({ prefixFilters, searchQuery, selectedMinDate, selectedMaxDate, sortOption, countryOption }: PerformSearchProps) {

    console.log("performSearch.ts - Here is the prefixFilters: ", prefixFilters)
    console.log("performSearch.ts - Here is the selectedMinDate: ", selectedMinDate)
    console.log("performSearch.ts - Here is the selectedMaxDate: ", selectedMaxDate)
    
    let noCredits = false

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prefixFilters, searchQuery, selectedMinDate, selectedMaxDate, sortOption, countryOption }),
      });

      if (response.status === 403) {
        console.log("403")
        throw new Error("NoCreditsError");
      }

      const data = await response.json();

      const apiResults = data.processedResults
      const searchId = data.searchId
      
      return {apiResults, searchId, noCredits}
     

    } catch (error:any) {
      if (error.message === "NoCreditsError") {
        return { noCredits: true };
      } else
      console.error(
        "Error during API call:",
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      throw error;
    }
  }