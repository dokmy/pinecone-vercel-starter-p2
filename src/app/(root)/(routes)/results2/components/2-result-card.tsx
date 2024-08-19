import React from "react";

interface ResultCardProps {
  data: {
    id: string;
    caseName: string;
    caseNeutralCit: string;
    caseActionNo: string;
    caseDate: Date;
    caseUrl: string;
    createdAt: Date;
    searchId: string;
    userId: string;
  };
}

const ResultCard: React.FC<ResultCardProps> = ({ data }) => {
  const handleCaseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(data.caseUrl, "_blank");
  };

  return (
    <div className="mb-2">
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
