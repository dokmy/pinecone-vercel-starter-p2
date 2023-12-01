// Search.tsx

import React, { FormEvent, ChangeEvent } from "react";

const Search: React.FC = () => {
  return (
    <div id="Search" className="flex flex-col w-full bg-gray-100">
      <form
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
      </form>
    </div>
  );
};

export default Search;
