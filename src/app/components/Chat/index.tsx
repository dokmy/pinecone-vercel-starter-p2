// Chat.tsx

import React, { FormEvent, ChangeEvent } from "react";
import Messages from "./Messages";
import { Message } from "ai/react";
import { useChat } from "ai/react";
import { useEffect } from "react";

interface Chat {
  raw_case_num: string;
  query: string;
  case_date: string;
  case_action_no: string;
  case_neutral_cit: string;
  url: string;
}

const Chat: React.FC<Chat> = ({
  raw_case_num,
  query,
  case_date,
  case_action_no,
  case_neutral_cit,
  url,
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

  return (
    <div id="chat" className="flex flex-col w-full h-full lg:mx-0">
      <div className="flex flex-col bg-gray-800 p-3 text-gray-200 border-b border-r">
        <div className="flex flex-col border rounded-lg p-3 bg-gray-700">
          <span>Date: {case_date}</span>
          <span>Action no.: {case_action_no}</span>
          <span>Neutral Citation: {case_neutral_cit}</span>
          <a href={url} target="_blank" rel="noopener noreferrer">
            Click here to the case
          </a>
        </div>
      </div>
      <div className="border-r bg-slate-800 overflow-scroll">
        <Messages messages={messages} />
      </div>

      <>
        <div className="border">
          <form onSubmit={handleSubmit} className="mt-1 mb-1 relative p-3">
            <input
              type="text"
              className="input-glow appearance-none border rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline pl-3 pr-10 bg-gray-700 border-gray-700 transition-shadow duration-200 h-16"
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
