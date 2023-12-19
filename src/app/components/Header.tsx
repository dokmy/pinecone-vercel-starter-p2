import Image from "next/image";
import FastLegalLogo from "../../../public/logo_rec.png";
import Button from "@mui/material/Button";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { UserButton } from "@clerk/nextjs";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@mui/material/styles";

interface HeaderProps {
  filteredResults: any[];
  resultsShown: number;
  setResultsShown: React.Dispatch<React.SetStateAction<number>>;
  className?: string;
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

export default function Header({
  filteredResults,
  resultsShown,
  setResultsShown,
  className,
}: HeaderProps) {
  return (
    <header
      className={`flex items-center justify-between text-gray-200 text-2xl ${className} py-2 w-full border-b`}
    >
      <Image
        src={FastLegalLogo}
        alt="fastlegal-logo"
        width="170"
        height="50"
        className="ml-3 my-1"
      />

      <div className="mr-3 flex flex-row items-center">
        <div className="mr-3 font-sans text-base w-full align-right whitespace-nowrap">
          Found {filteredResults.length} Results
        </div>
        <ThemeProvider theme={newTheme}>
          <FormControl fullWidth className="mr-3">
            <InputLabel id="demo-simple-select-label">Showing: </InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={resultsShown.toString()}
              label="resultsShown"
              onChange={(event: SelectChangeEvent) =>
                setResultsShown(parseInt(event.target.value, 10))
              }
              sx={{
                ".MuiInputBase-root": {
                  height: "40px", // Adjust the height as needed
                },
                ".MuiSelect-select": {
                  paddingTop: "6px", // Adjust the padding to vertically center the text
                  paddingBottom: "6px",
                },
              }}
            >
              <MenuItem value={1}>1</MenuItem>
              <MenuItem value={2}>2</MenuItem>
              <MenuItem value={3}>3</MenuItem>
              <MenuItem value={4}>4</MenuItem>
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={6}>6</MenuItem>
              <MenuItem value={7}>7</MenuItem>
              <MenuItem value={8}>8</MenuItem>
              <MenuItem value={9}>9</MenuItem>
              <MenuItem value={10}>10</MenuItem>
            </Select>
          </FormControl>
        </ThemeProvider>

        <div className="ml-3">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
