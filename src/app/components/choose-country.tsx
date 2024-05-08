import React from "react";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

interface ChooseCountryProps {
  countryOption: string;
  setCountryOption: React.Dispatch<React.SetStateAction<string>>;
}

const ChooseCountry: React.FC<ChooseCountryProps> = ({
  countryOption,
  setCountryOption,
}) => {
  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    option: string
  ) => {
    setCountryOption(option);
  };
  return (
    <div className="flex flex-col lg:flex-row items-center">
      <p className="hidden xl:block">Country to search:</p>
      <div id="sort-by" className="border border-gray-300 ml-3 rounded-sm h-13">
        <ToggleButtonGroup
          color="primary"
          value={countryOption}
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
          <ToggleButton value="hk">Hong Kong</ToggleButton>
          <ToggleButton value="uk">United Kingdom</ToggleButton>
        </ToggleButtonGroup>
      </div>
    </div>
  );
};

export default ChooseCountry;
