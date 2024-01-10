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
    

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filters, searchQuery, selectedMinDate, selectedMaxDate, sortOption }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      const apiResults = data.filteredResults
      const searchId = data.searchId
      
      return {apiResults, searchId}
     

    } catch (error) {
      console.error(
        "Error during API call:",
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      throw error;
    }
  }