import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "./ui/button";

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
  return (
    <div className="h-min p-3">
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger className="justify-center">
            <div className="px-2">{data.caseName}</div>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="text-center">
              <li>
                <p>Action No: {data.caseActionNo}</p>
              </li>
              <li>
                <p>Neutral Citation: {data.caseNeutralCit}</p>
              </li>
              <li>
                <p>Date: {data.caseDate.toDateString()}</p>
              </li>
            </ul>
            <div className="flex justify-center items-center mt-3">
              <Button>Read the case</Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ResultCard;