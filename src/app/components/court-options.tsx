"use client";
import React from "react";
import { Autocomplete, TextField, Chip } from "@mui/material";

interface AutocompleteField {
  id: string;
  label: string;
  options: string[];
  state: string[];
  setState: React.Dispatch<React.SetStateAction<string[]>>;
}

const CourtOptions: React.FC<AutocompleteField> = ({
  id,
  label,
  options,
  state,
  setState,
}) => {
  return (
    <Autocomplete
      key={id}
      className="basis-1/2"
      multiple
      id={id}
      options={options}
      getOptionLabel={(option) => option}
      value={state}
      onChange={(event, newValue: string[] | null) => {
        if (newValue) {
          setState(newValue);
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder="Choose an option"
          sx={{
            "& label": {
              color: "#B8BABB", // Label color
            },
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "#B8BABB", // Border color
              },
              "&.Mui-focused fieldset": {
                borderColor: "white", // Border color when the component is focused
              },
              "&:hover fieldset": {
                borderColor: "white", // Border color on hover
              },
              color: "white",
            },
          }}
        />
      )}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            label={option}
            sx={{
              backgroundColor: "grey", // Chip background color
              color: "white", // Text color inside chips
              margin: "2px", // Space around each chip
            }}
            {...getTagProps({ index })}
            key={option}
          />
        ))
      }
      sx={{
        width: "100%", // Full width of the container
        "& .MuiAutocomplete-paper": {
          color: "red", // For the list items in the dropdown
        },
        backgroundColor: "black", // Background color of the dropdown
        color: "red", // Text color inside the dropdown
        "& .MuiAutocomplete-popupIndicator": {
          color: "white", // Color of the dropdown indicator
        },
      }}
    />
  );
};

export default CourtOptions;
