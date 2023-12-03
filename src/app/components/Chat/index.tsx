// Chat.tsx

import React, { FormEvent, ChangeEvent } from "react";
import Messages from "./Messages";
import { useChat } from "ai/react";
import { useEffect } from "react";
import "src/app/globals.css";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface Chat {
  raw_case_num: string;
  query: string;
  case_date: string;
  case_action_no: string;
  case_neutral_cit: string;
  url: string;
  case_title: string;
}

const Chat: React.FC<Chat> = ({
  raw_case_num,
  query,
  case_date,
  case_action_no,
  case_neutral_cit,
  url,
  case_title,
}) => {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    body: { filter: raw_case_num },
    initialInput:
      "Please first summarise this case for me and then explain why this case is relevant to my siutation as follow: " +
      query,
  });

  useEffect(() => {
    const mockEvent = {
      preventDefault: () => {},
      // Add other minimal properties and methods if needed
    } as unknown as React.FormEvent<HTMLFormElement>;
    handleSubmit(mockEvent);
    console.log("haha");
  }, [raw_case_num, query]);

  const [expanded, setExpanded] = React.useState<string | false>(false);

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  return (
    <div id="chat" className="flex flex-col w-full h-full lg:mx-0">
      <div className="flex flex-col bg-gray-800 p-3 text-gray-200 border-b border-slate-400">
        <div>
          <Accordion
            expanded={expanded === "panel1"}
            onChange={handleChange("panel1")}
            className="bg-gray-700 text-gray-200"
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1bh-content"
              id="panel1bh-header"
            >
              <Typography
                sx={{ width: "100%", flexShrink: 0 }}
                className="font-serif"
              >
                {case_title}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography className="pl-5">
                <ul className="list-disc">
                  <li>Date: {case_date}</li>
                  <li>Action no.: {case_action_no}</li>
                  <li>Neutral Citation: {case_neutral_cit}</li>
                  <li>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-300 underline"
                    >
                      Click here to the case
                    </a>
                  </li>
                </ul>
              </Typography>
            </AccordionDetails>
          </Accordion>
        </div>
        {/* <div className="flex flex-col border rounded-lg p-3 bg-gray-700 pl-12">
          <span className="font-semibold font-serif text-xl">{case_title}</span>
          <span>Date: {case_date}</span>
          <span>Action no.: {case_action_no}</span>
          <span>Neutral Citation: {case_neutral_cit}</span>
          <a href={url} target="_blank" rel="noopener noreferrer">
            Click here to the case
          </a>
        </div> */}
      </div>
      <div className="border-slate-400 bg-slate-800 overflow-y-auto">
        <Messages messages={messages} />
      </div>

      <>
        <div className="">
          <form
            onSubmit={handleSubmit}
            className="mt-1 mb-1 relative p-3 border-t border-slate-400"
          >
            <input
              type="text"
              className="input-glow appearance-none border rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline pl-3 pr-10 bg-gray-800 border-gray-700 transition-shadow duration-200 h-16"
              value={input}
              onChange={handleInputChange}
            />

            <span className="absolute inset-y-0 right-3 flex items-center pr-3 pointer-events-none text-gray-400">
              Press ⮐ to send
            </span>
          </form>
        </div>
      </>
    </div>
  );
};

export default Chat;
