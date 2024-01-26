"use client";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@mui/material/styles";
import { deepOrange } from "@mui/material/colors";

interface SearchPeriodProps {
  selectedMinDate: dayjs.Dayjs;
  setSelectedMinDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>;
  selectedMaxDate: dayjs.Dayjs;
  setSelectedMaxDate: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>;
}

const SearchPeriod: React.FC<SearchPeriodProps> = ({
  selectedMinDate,
  setSelectedMinDate,
  selectedMaxDate,
  setSelectedMaxDate,
}) => {
  return (
    <div className="flex flex-row items-stretch space-x-5">
      <div id="min-date" className="mb-4">
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            disableFuture
            label="Minimum date"
            value={selectedMinDate}
            onChange={(newValue) => setSelectedMinDate(dayjs(newValue))}
            sx={{
              bgcolor: "transparent",
              borderColor: "white",
              "& .MuiOutlinedInput-root": {
                " & fieldset": {
                  borderColor: "#B8BABB",
                },
                " &:hover fieldset": {
                  borderColor: "white",
                },
              },
              "& .MuiInputLabel-root": {
                color: "#B8BABB",
              },
              "& .MuiInputBase-input": {
                color: "white", // Text color
              },
              "& .MuiButtonBase-root": {
                color: "#B8BABB",
              },
            }}
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
            sx={{
              bgcolor: "transparent",
              borderColor: "white",
              "& .MuiOutlinedInput-root": {
                " & fieldset": {
                  borderColor: "#B8BABB",
                },
                " &:hover fieldset": {
                  borderColor: "white",
                },
              },
              "& .MuiInputLabel-root": {
                color: "#B8BABB",
              },
              "& .MuiInputBase-input": {
                color: "white", // Text color
              },
              "& .MuiButtonBase-root": {
                color: "#B8BABB",
              },
            }}
          />
        </LocalizationProvider>
      </div>
    </div>
  );
};

export default SearchPeriod;
