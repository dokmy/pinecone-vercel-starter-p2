import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ChatResultCardProps {
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

const ChatResultCard: React.FC<ChatResultCardProps> = ({ data }) => {
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ChatResultCard;
