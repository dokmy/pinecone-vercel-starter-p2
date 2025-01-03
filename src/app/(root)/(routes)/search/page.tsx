"use client";
import React from "react";
import SearchForm from "./components/search-form";

const LoadingSpinner = ({ message }: { message: string }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SearchPage = () => {
  return (
    <div>
      <SearchForm LoadingStateComponent={LoadingSpinner} />
    </div>
  );
};

export default SearchPage;
