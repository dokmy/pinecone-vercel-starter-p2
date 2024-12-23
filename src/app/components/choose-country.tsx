import React from "react";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { ChooseCountryProps } from "./types";
import { CountryOption } from "@/lib/types/search";

const ChooseCountry: React.FC<ChooseCountryProps> = ({
  countryOption,
  setCountryOption,
}) => {
  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    option: CountryOption | null
  ) => {
    if (option) {
      setCountryOption(option);
    }
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
          <ToggleButton value="hk">Hong Kong</ToggleButton>
          <ToggleButton value="uk">United Kingdom</ToggleButton>
        </ToggleButtonGroup>
      </div>
    </div>
  );
};

export default ChooseCountry;
