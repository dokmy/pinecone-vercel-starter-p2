"use client";
import React from "react";
import { SearchResult } from "../../../../../types";

interface ResultCardProps {
  data: SearchResult;
}

const ResultCard: React.FC<ResultCardProps> = ({ data }) => {
  const handleCaseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(data.caseUrl, "_blank");
  };

  return (
    <div className="mb-2">
      {data.gptScore !== null && (
        <div className="text-xs text-green-400 mb-1">
          Relevance Score: {data.gptScore.toFixed(1)}/10
        </div>
      )}
      <h3 className="text-base font-semibold text-blue-600">
        <a href="#" onClick={handleCaseClick} className="hover:underline">
          {data.caseName}
        </a>
      </h3>
      <div className="text-xs text-gray-600">
        <span>{data.caseActionNo} | </span>
        <span>{data.caseNeutralCit} | </span>
        <span>{data.caseDate.toDateString()}</span>
      </div>
    </div>
  );
};

export default ResultCard;
