import dayjs from "dayjs";



interface PerformSearchProps {
    filters: string[]
    searchQuery: string
    selectedMinDate: dayjs.Dayjs
    selectedMaxDate: dayjs.Dayjs
    sortOption: string
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



export async function performSearch({ filters, searchQuery, selectedMinDate, selectedMaxDate, sortOption }: PerformSearchProps) {
    
    let noCredits = false

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filters, searchQuery, selectedMinDate, selectedMaxDate, sortOption }),
      });

      if (response.status === 403) {
        throw new Error("NoCreditsError");
      }

      const data = await response.json();

      const apiResults = data.filteredResults
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