"use client";
import React from "react";
import ResultCard from "@/components/result-card";
import ChatMessages from "@/components/chat-messages";
import axios from "axios";
import { useEffect, useState } from "react";
import { useChat } from "ai/react";

interface ChatComponentProps {
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
  query: string;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ data, query }) => {
  const [dbMessages, setDbMessages] = useState([]);
  const [chatArgs, setChatArgs] = useState({});

  useEffect(() => {
    const fetchDbMessages = async () => {
      try {
        const response = await axios.post(`/api/get-messages`, {
          searchResultId: data.id,
        });
        setDbMessages(response.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchDbMessages();
  }, [data.id]);

  useEffect(() => {
    if (dbMessages.length === 0) {
      console.log("no messages. Adding initial input.");
      setChatArgs({
        initialInput:
          "Please first summarise this case for me and then explain why this case is relevant to my situation as follow: " +
          query,
      });
    } else {
      console.log("Have messages. Adding initial messages.");
      const simplifiedMessages = dbMessages.map(({ role, content }) => ({
        role,
        content,
      }));
      setChatArgs({ initialMessages: simplifiedMessages });
    }
  }, [dbMessages, query]);

  useEffect(() => {
    const mockEvent = {
      preventDefault: () => {},
      // Add other minimal properties and methods if needed
    } as unknown as React.FormEvent<HTMLFormElement>;
    handleSubmit(mockEvent);
    console.log("haha");
  }, [query]);

  useEffect(() => {
    console.log("chatArgs updated:", chatArgs);
  }, [chatArgs]);

  console.log(chatArgs);

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    ...chatArgs,
    body: { filter: data.caseNeutralCit, searchResultId: data.id },
  });

  if (Object.keys(chatArgs).length == 0) return <div>Loading...</div>;

  return (
    <div className="flex flex-col w-full h-full">
      <ResultCard data={data} />
      <ChatMessages key={data.id} messages={messages} />
      <div>
        <form
          onSubmit={handleSubmit}
          className="mt-1 mb-1 relative p-3 border-t"
        >
          <div className="flex-row space-x-2">
            <textarea
              className="resize-none overflow-auto max-h-24 border rounded w-full p-3 pl-3 pr-20 text-gray-200 leading-tight bg-black border-gray-700 duration-200 h-20"
              value={input}
              onChange={handleInputChange}
            ></textarea>

            <span className="absolute inset-y-0 right-5 flex items-center pr-3 pointer-events-none text-gray-400">
              <div className="h-3 w-3">⮐</div>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatComponent;
