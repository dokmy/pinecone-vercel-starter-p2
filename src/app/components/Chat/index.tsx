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
      <div className="border-2 border-gray-600 rounded-lg flex flex-col bg-gray-800 p-3 mb-3 text-gray-200">
        <span>Date: {case_date}</span>
        <span>Action no.: {case_action_no}</span>
        <span>Neutral Citation: {case_neutral_cit}</span>
        <a href={url} target="_blank" rel="noopener noreferrer">
          Click here to the case
        </a>
      </div>
      <Messages messages={messages} />
      <>
        <form
          onSubmit={handleSubmit}
          className="mt-5 mb-5 relative bg-gray-700 rounded-lg"
        >
          <input
            type="text"
            className="input-glow appearance-none border rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline pl-3 pr-10 bg-gray-600 border-gray-600 transition-shadow duration-200"
            value={input}
            onChange={handleInputChange}
          />

          <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
            Press ⮐ to send
          </span>
        </form>
      </>
    </div>
  );
};

export default Chat;
