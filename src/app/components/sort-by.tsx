import React from "react";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { SortByProps } from "./types";
import { SortOption } from "@/lib/types/search";

const SortBy: React.FC<SortByProps> = ({ sortOption, setSortOption }) => {
  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    option: SortOption | null
  ) => {
    if (option) {
      setSortOption(option);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-center">
      <p className="hidden xl:block">Sort the results by:</p>
      <div id="sort-by" className="border border-gray-300 ml-3 rounded-sm h-13">
        <ToggleButtonGroup
          color="primary"
          value={sortOption}
          exclusive
          onChange={handleChange}
          aria-label="Platform"
          sx={{
            backgroundColor: "black",
            ".MuiToggleButton-root": {
              borderColor: "gray.300",
              color: "white",
              "&.Mui-selected, &.Mui-selected:hover": {
                backgroundColor: "gray",
                color: "white",
              },
              "&:hover": {
                backgroundColor: "gray.800",
                color: "white",
              },
            },
          }}
        >
          <ToggleButton value="Relevance">Relevance</ToggleButton>
          <ToggleButton value="Recency">Recency</ToggleButton>
        </ToggleButtonGroup>
      </div>
    </div>
  );
};

export default SortBy;
