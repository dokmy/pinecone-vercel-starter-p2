// Search.tsx

import React, { FormEvent, ChangeEvent } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";

const Search: React.FC = () => {
  return (
    <div id="Search" className="flex flex-col w-full bg-gray-800">
      <h2 className="text-xl font-semibold font-co text-white">
        Search by situation
      </h2>
      <Box
        component="form"
        sx={{
          "& .MuiTextField-root": { m: 1, width: "25ch" },
        }}
        noValidate
        autoComplete="off"
      >
        <div>
          <TextField
            id="filled-multiline-static"
            label="Situation"
            multiline
            rows={4}
            placeholder="E.g. My client slips and falls in a shopping mall while working..."
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-input": {
                color: "white", // Font color of the input text
              },
              "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
                borderColor: "gray", // Color of the border (outlined variant)
              },
              "&:hover .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline":
                {
                  borderColor: "white", // Color of the border on hover (outlined variant)
                },
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                {
                  borderColor: "white", // Color of the border when focused (outlined variant)
                },
              "& .MuiInputLabel-outlined": {
                color: "grey", // Color of the label text
              },
              "& .MuiInputLabel-outlined.Mui-focused": {
                color: "grey", // Color of the label text when focused
              },
            }}
          />
        </div>
      </Box>

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
