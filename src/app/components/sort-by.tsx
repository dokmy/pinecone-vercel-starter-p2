import React from "react";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

interface SortByProps {
  sortOption: string;
  setSortOption: React.Dispatch<React.SetStateAction<string>>;
}

const SortBy: React.FC<SortByProps> = ({ sortOption, setSortOption }) => {
  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    option: string
  ) => {
    setSortOption(option);
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
            backgroundColor: "black", // Background color for the toggle button group
            ".MuiToggleButton-root": {
              // Styles for each toggle button
              borderColor: "gray.300", // Border color for toggle buttons
              color: "white", // Text color for toggle buttons
              "&.Mui-selected, &.Mui-selected:hover": {
                // Styles for a selected toggle button
                backgroundColor: "gray", // Background color for a selected toggle button
                color: "white", // Text color for a selected toggle button
              },
              "&:hover": {
                // Hover styles for toggle buttons
                backgroundColor: "gray.800", // Background color on hover for toggle buttons
                color: "white", // Text color on hover for toggle buttons
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
