import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "./ui/button";
import { PlusCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";

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
  onReadCaseClick: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ data, onReadCaseClick }) => {
  return (
    <div className="">
      <Accordion type="single" defaultValue="item-1" collapsible>
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
              <div className="mr-2">Read the case</div>
              <Switch onCheckedChange={onReadCaseClick}></Switch>
            </div>
            {/* <div className="flex justify-center items-center mt-2">
              <div className="mr-2">Add one more case</div>
              <button className="border rounded-lg">
                <PlusCircle className="h-5 w-5" />
              </button>
            </div> */}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ResultCard;
