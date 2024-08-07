// Chat.tsx

import React, { FormEvent, ChangeEvent } from "react";
import Messages from "./Messages";
import { useChat } from "ai/react";
import { useEffect } from "react";
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
      <div className="flex flex-col bg-black p-3 text-gray-200 border-b border-slate-400">
        <div>
          <Accordion
            expanded={expanded === "panel1"}
            onChange={handleChange("panel1")}
            className="bg-black text-gray-200"
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: "white" }} />}
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
      </div>
      <div className="border-slate-400 bg-[#18181A] overflow-auto">
        <Messages messages={messages} />
      </div>

      <>
        <div>
          <form
            onSubmit={handleSubmit}
            className="mt-1 mb-1 relative p-3 border-t"
          >
            <div className="flex-row space-x-2">
              <input
                className="resize-none overflow-auto max-h-24 border rounded w-full py-2 pl-3 pr-20 text-gray-200 leading-tight bg-black border-gray-700 duration-200 h-24"
                value={input}
                onChange={handleInputChange}
              ></input>

              <span className="absolute inset-y-0 right-5 flex items-center pr-3 pointer-events-none text-gray-400">
                <div className="h-3 w-3">⮐</div>
              </span>
            </div>
          </form>
        </div>
      </>
    </div>
  );
};

export default Chat;
