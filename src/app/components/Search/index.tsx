// Search.tsx

import React, { FormEvent, ChangeEvent, useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import Autocomplete from "@mui/material/Autocomplete";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Button from "@mui/material/Button";
import { Chip } from "@mui/material";

interface SearchProps {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  selectedMinDate: dayjs.Dayjs;
  setSelectedMinDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>;
  selectedMaxDate: dayjs.Dayjs;
  setSelectedMaxDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>;
  cofa: string[];
  setCofa: React.Dispatch<React.SetStateAction<string[]>>;
  coa: string[];
  setCoa: React.Dispatch<React.SetStateAction<string[]>>;
  coficivil: string[];
  setcoficivil: React.Dispatch<React.SetStateAction<string[]>>;
  coficriminal: string[];
  setCoficriminal: React.Dispatch<React.SetStateAction<string[]>>;
  cofiprobate: string[];
  setCofiprobate: React.Dispatch<React.SetStateAction<string[]>>;
  ct: string[];
  setCt: React.Dispatch<React.SetStateAction<string[]>>;
  dc: string[];
  setDc: React.Dispatch<React.SetStateAction<string[]>>;
  fc: string[];
  setFc: React.Dispatch<React.SetStateAction<string[]>>;
  lt: string[];
  setLt: React.Dispatch<React.SetStateAction<string[]>>;
  others: string[];
  setOthers: React.Dispatch<React.SetStateAction<string[]>>;
  sortOption: string;
  setSortOption: React.Dispatch<React.SetStateAction<string>>;
  performSearch: (event: React.FormEvent<HTMLFormElement>) => void;
}

const newTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#3f51b5",
    },
    secondary: {
      main: "#f50057",
    },
  },
  components: {
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          // Set the color for the label text
          color: "#c2c2c2",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        outlined: {
          borderColor: "white",
          color: "white",
          width: "100%",
          "&:hover": {
            borderColor: "green", // Border color on hover
            color: "green", // Text color on hover
            fontWeight: 600,
          },
        },
      },
    },
  },
});

const Search: React.FC<SearchProps> = ({
  searchQuery,
  setSearchQuery,
  selectedMinDate,
  setSelectedMinDate,
  selectedMaxDate,
  setSelectedMaxDate,
  cofa,
  setCofa,
  coa,
  setCoa,
  coficivil,
  setcoficivil,
  coficriminal,
  setCoficriminal,
  cofiprobate,
  setCofiprobate,
  ct,
  setCt,
  dc,
  setDc,
  fc,
  setFc,
  lt,
  setLt,
  others,
  setOthers,
  sortOption,
  setSortOption,
  performSearch,
}) => {
  const [searchQueryError, setSearchQueryError] = useState(false);
  const [selectedMinDateError, setSelectedMinDateError] = useState(false);
  const [selectedMaxDateError, setSelectedMaxDateError] = useState(false);
  const [sortOptionError, setSortOptionError] = useState(false);

  const checkRequired = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let hasError = false;

    if (!searchQuery) {
      setSearchQueryError(true);
      hasError = true;
    }

    if (!selectedMinDate) {
      setSelectedMinDateError(true);
      hasError = true;
    }

    if (!selectedMaxDate) {
      setSelectedMaxDateError(true);
      hasError = true;
    }

    if (!sortOption) {
      setSortOptionError(true);
      hasError = true;
    }

    if (!hasError) {
      performSearch(event);
    }
  };

  return (
    <div
      id="Search"
      className="flex flex-col w-full bg-gray-800 space-y-4 overflow-y-scroll h-full p-2"
    >
      <h2 className="text-xl font-semibold font-co text-white">
        Search by situation
      </h2>

      {/* start */}

      <ThemeProvider theme={newTheme}>
        <form onSubmit={checkRequired} noValidate autoComplete="off">
          <div id="search-bar" className="mb-4">
            <Box component="div">
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
                />
              </div>
            </Box>
          </div>

          <div id="min-date" className="mb-4">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                disableFuture
                label="Minimum date"
                value={selectedMinDate}
                onChange={(newValue) => setSelectedMinDate(dayjs(newValue))}
              />
            </LocalizationProvider>
          </div>

          <div id="max-date" className="mb-4">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                disableFuture
                label="Maximum date"
                value={selectedMaxDate}
                onChange={(newValue) => setSelectedMaxDate(dayjs(newValue))}
              />
            </LocalizationProvider>
          </div>

          <div id="sort-by" className="mb-4">
            <FormControl>
              <FormLabel id="sort by">Sort the results by:</FormLabel>
              <RadioGroup
                aria-labelledby="demo-radio-buttons-group-label"
                defaultValue="Relevance"
                name="radio-buttons-group"
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value)}
              >
                <FormControlLabel
                  value="Relevance"
                  control={<Radio />}
                  label="Relevance"
                />
                <FormControlLabel
                  value="Recency"
                  control={<Radio />}
                  label="Recency"
                />
              </RadioGroup>
            </FormControl>
          </div>

          <div id="count-options" className="space-y-4">
            <Autocomplete
              multiple
              id="tags-outlined"
              options={court_of_final_appeal}
              getOptionLabel={(option) => option}
              filterSelectedOptions
              value={cofa}
              onChange={(event, newValue) => setCofa(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Court of Final Appeal"
                  placeholder="Choose an option"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    key={getTagProps({ index }).key} // Apply key directly
                  />
                ))
              }
            />
            <Autocomplete
              multiple
              id="tags-outlined"
              options={court_of_appeal}
              getOptionLabel={(option) => option}
              filterSelectedOptions
              value={coa}
              onChange={(event, newValue) => setCoa(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Court of Appeal"
                  placeholder="Choose an option"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    key={getTagProps({ index }).key} // Apply key directly
                  />
                ))
              }
            />
            <Autocomplete
              multiple
              id="tags-outlined"
              options={court_of_first_instance_civil}
              getOptionLabel={(option) => option}
              filterSelectedOptions
              value={coficivil}
              onChange={(event, newValue) => setcoficivil(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Court of First Instance - Civil Matters"
                  placeholder="Choose an option"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    key={getTagProps({ index }).key} // Apply key directly
                  />
                ))
              }
            />
            <Autocomplete
              multiple
              id="tags-outlined"
              options={court_of_first_instance_criminal}
              getOptionLabel={(option) => option}
              filterSelectedOptions
              value={coficriminal}
              onChange={(event, newValue) => setCoficriminal(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Court of First Instance - Criminal & Appeal Cases"
                  placeholder="Choose an option"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    key={getTagProps({ index }).key} // Apply key directly
                  />
                ))
              }
            />
            <Autocomplete
              multiple
              id="tags-outlined"
              options={court_of_first_instance_probate}
              getOptionLabel={(option) => option}
              filterSelectedOptions
              value={cofiprobate}
              onChange={(event, newValue) => setCofiprobate(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Court of First Instance - Probate Matters"
                  placeholder="Choose an option"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    key={getTagProps({ index }).key} // Apply key directly
                  />
                ))
              }
            />
            <Autocomplete
              multiple
              id="tags-outlined"
              options={competition_tribunal}
              getOptionLabel={(option) => option}
              filterSelectedOptions
              value={ct}
              onChange={(event, newValue) => setCt(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Competition Tribunal"
                  placeholder="Choose an option"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    key={getTagProps({ index }).key} // Apply key directly
                  />
                ))
              }
            />
            <Autocomplete
              multiple
              id="tags-outlined"
              options={district_court}
              getOptionLabel={(option) => option}
              filterSelectedOptions
              value={dc}
              onChange={(event, newValue) => setDc(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="District Court"
                  placeholder="Choose an option"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    key={getTagProps({ index }).key} // Apply key directly
                  />
                ))
              }
            />
            <Autocomplete
              multiple
              id="tags-outlined"
              options={family_court}
              getOptionLabel={(option) => option}
              filterSelectedOptions
              value={fc}
              onChange={(event, newValue) => setFc(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Family Court"
                  placeholder="Choose an option"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    key={getTagProps({ index }).key} // Apply key directly
                  />
                ))
              }
            />
            <Autocomplete
              multiple
              id="tags-outlined"
              options={lands_tribunal}
              getOptionLabel={(option) => option}
              filterSelectedOptions
              value={lt}
              onChange={(event, newValue) => setLt(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Lands Tribunal"
                  placeholder="Choose an option"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    key={getTagProps({ index }).key} // Apply key directly
                  />
                ))
              }
            />
            <Autocomplete
              multiple
              id="tags-outlined"
              options={court_others}
              getOptionLabel={(option) => option}
              filterSelectedOptions
              value={others}
              onChange={(event, newValue) => setOthers(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Others"
                  placeholder="Choose an option"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    key={getTagProps({ index }).key} // Apply key directly
                  />
                ))
              }
            />
          </div>

          <div id="submit-button" className="mt-4">
            <Button variant="outlined" type="submit">
              Search
            </Button>
          </div>
        </form>
      </ThemeProvider>

      {/* end */}
    </div>
  );
};

const court_of_final_appeal = ["FACV", "FACC", "FAMV", "FAMC", "FAMP"];
const court_of_appeal = [
  "CACV",
  "CACC",
  "CAAR",
  "CASJ",
  "CAQL",
  "CAAG",
  "CAMP",
];
const court_of_first_instance_civil = [
  "HCA",
  "HCAL",
  "HCAJ",
  "HCAD",
  "HCB",
  "HCCL",
  "HCCW",
  "HCSD",
  "HCBI",
  "HCCT",
  "HCMC",
  "HCMP",
  "HCCM",
  "HCPI",
  "HCBD",
  "HCBS",
  "HCSN",
  "HCCD",
  "HCZZ",
  "HCMH",
  "HCIP",
];
const court_of_first_instance_criminal = [
  "HCCC",
  "HCMA",
  "HCLA",
  "HCIA",
  "HCSA",
  "HCME",
  "HCOA",
  "HCUA",
  "HCED",
  "HCAA",
  "HCCP",
];
const court_of_first_instance_probate = [
  "HCAP",
  "HCAG",
  "HCCA",
  "HCEA",
  "HCRC",
  "HCCI",
  "HCCV",
  "HCUA",
];
const competition_tribunal = ["CTAR", "CTEA", "CTA", "CTMP"];
const district_court = [
  "DCCJ",
  "DCCC",
  "DCDT",
  "DCTC",
  "DCEC",
  "DCEO",
  "DCMA",
  "DCMP",
  "DCOA",
  "DCPI",
  "DCPA",
  "DCSA",
  "DCZZ",
  "DCSN",
];
const family_court = ["FCMC", "FCJA", "FCMP", "FCAD", "FCRE"];
const lands_tribunal = [
  "LDPA",
  "LDPB",
  "LDPD",
  "LDPE",
  "LDRT",
  "LDNT",
  "LDLA",
  "LDRA",
  "LDBG",
  "LDGA",
  "LDLR",
  "LDHA",
  "LDBM",
  "LDDB",
  "LDDA",
  "LDMT",
  "LDCS",
  "LDRW",
  "LDMR",
  "LDMP",
];
const court_others = [
  "CCDI",
  "ESCC",
  "ESS",
  "FLCC",
  "FLS",
  "KCCC",
  "KCS",
  "KTCC",
  "KTS",
  "LBTC",
  "OATD",
  "STCC",
  "STMP",
  "STS",
  "SCTC",
  "TMCC",
  "TMS",
  "WKCC",
  "WKS",
];

export default Search;
