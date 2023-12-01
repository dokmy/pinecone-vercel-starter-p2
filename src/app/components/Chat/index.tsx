// Chat.tsx

import React, { FormEvent, ChangeEvent } from "react";
import Messages from "./Messages";
import { Message } from "ai/react";
import { useChat } from "ai/react";
import { useEffect } from "react";

interface Chat {
  raw_case_num: string;
}

const Chat: React.FC<Chat> = ({ raw_case_num }) => {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    body: { filter: raw_case_num },
    initialInput: "Please summarise this case for me.",
  });

  useEffect(() => {
    const mockEvent = {
      preventDefault: () => {},
      // Add other minimal properties and methods if needed
    } as unknown as React.FormEvent<HTMLFormElement>;

    handleSubmit(mockEvent);
    console.log("haha");
  }, []);

  return (
    <div id="chat" className="flex flex-col w-full h-full lg:mx-0">
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
