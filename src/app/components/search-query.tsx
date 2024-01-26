"use client";
import { TextField } from "@mui/material";

interface SearchQueryProps {
  searchQueryError: boolean;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}

const SearchQuery: React.FC<SearchQueryProps> = ({
  searchQueryError,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <div>
      <TextField
        required
        error={searchQueryError}
        helperText={searchQueryError ? "This field is required" : ""}
        id="filled-multiline-static"
        label="Your search query"
        multiline
        rows={4}
        placeholder="E.g. My client slips and falls in a shopping mall while working..."
        variant="outlined"
        fullWidth={true}
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        sx={{
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: "#B8BABB", // Default border color
            },
            "&:hover fieldset": {
              borderColor: "white", // Border color on hover
            },
            "&.Mui-focused fieldset": {
              borderColor: "white", // Border color when the component is focused
            },
          },
          "& .MuiInputBase-input": {
            color: "white", // Text color
          },
          "& .MuiInputLabel-root": {
            color: "grey", // Label color
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: "white", // Label color when focused
          },
          "& .Mui-error": {
            color: "#ff6b81", // Color for error state
          },
          backgroundColor: "transparent", // Background color of the TextField
        }}
      />
    </div>
  );
};

export default SearchQuery;
