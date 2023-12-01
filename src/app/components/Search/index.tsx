// Search.tsx

import React, { FormEvent, ChangeEvent } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";

const newTheme = (theme: any) =>
  createTheme({
    ...theme,
    palette: {
      mode: "dark",
      primary: {
        main: "#3f51b5",
      },
      secondary: {
        main: "#f50057",
      },
    },
  });

const Search: React.FC = () => {
  return (
    <div id="Search" className="flex flex-col w-full bg-gray-800 space-y-4">
      <h2 className="text-xl font-semibold font-co text-white">
        Search by situation
      </h2>
      <div id="search-bar">
        <ThemeProvider theme={newTheme}>
          <Box
            component="form"
            sx={{
              "& .MuiTextField-root": { m: 0, width: "25ch" },
            }}
            noValidate
            autoComplete="off"
          >
            <div>
              <TextField
                id="filled-multiline-static"
                label="Your search query"
                multiline
                rows={4}
                placeholder="E.g. My client slips and falls in a shopping mall while working..."
                variant="outlined"
              />
            </div>
          </Box>
        </ThemeProvider>
      </div>

      <div id="min-date">
        <ThemeProvider theme={newTheme}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Minimum date"
              defaultValue={dayjs("1991-07-11")}
            />
          </LocalizationProvider>
        </ThemeProvider>
      </div>

      <div id="max-date">
        <ThemeProvider theme={newTheme}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker label="Maximum date" defaultValue={dayjs()} />
          </LocalizationProvider>
        </ThemeProvider>
      </div>

      {/* <form
        //   onSubmit={handleMessageSubmit}
        className="mt-5 mb-5 relative bg-gray-700 rounded-lg"
      >
        <input
          type="text"
          className="input-glow appearance-none border rounded w-full py-2 text-gray-200 leading-tight focus:outline-none focus:shadow-outline pl-3 pr-10 bg-gray-600 border-gray-600 transition-shadow duration-200"
          // onChange={handleInputChange}
        />

        <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 box-border">
          Press ⮐ to send
        </span>
      </form> */}
    </div>
  );
};

export default Search;
