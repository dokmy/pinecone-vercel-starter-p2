"use client";
import React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { Chip } from "@mui/material";

// Define a type for the AutocompleteField object
type AutocompleteField = {
  id: string;
  label: string;
  options: string[];
  state: string[];
  setState: React.Dispatch<React.SetStateAction<string[]>>;
};

const renderAutocomplete = (field: AutocompleteField, index: number) => (
  <Autocomplete
    key={field.id}
    className="basis-1/2"
    multiple
    id={field.id}
    options={field.options}
    getOptionLabel={(option) => option}
    value={field.state}
    onChange={(event, newValue: string[] | null) => {
      // Ensure newValue is not null before calling setState
      if (newValue) {
        field.setState(newValue);
      }
    }}
    renderInput={(params) => (
      <TextField
        {...params}
        label={field.label}
        placeholder="Choose an option"
      />
    )}
    renderTags={(value, getTagProps) =>
      value.map((option, index) => (
        <Chip label={option} {...getTagProps({ index })} key={index} />
      ))
    }
  />
);

export default renderAutocomplete;
