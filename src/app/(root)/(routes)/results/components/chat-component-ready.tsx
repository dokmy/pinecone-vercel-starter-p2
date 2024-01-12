"use client";
import React from "react";
import ResultCard from "@/components/result-card";
import ChatMessages from "@/components/chat-messages";
import { useChat } from "ai/react";
import { Message } from "ai";
import { useEffect, useState } from "react";

interface ChatComponentReadyProps {
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
  chatArgs: chatArgs;
  isIframeShown: boolean;
  onToggleIframe: () => void;
}

interface chatArgs {
  initialInput?: string;
  initialMessages?: Message[];
}

const ChatComponentReady: React.FC<ChatComponentReadyProps> = (props) => {
  const { data, query, chatArgs, isIframeShown, onToggleIframe } = props;

  console.log("CCR is here. Here is the real chatArgs: ", chatArgs);

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    ...chatArgs,
    body: { filter: data.caseNeutralCit, searchResultId: data.id },
  });

  useEffect(() => {
    const mockEvent = {
      preventDefault: () => {},
    } as unknown as React.FormEvent<HTMLFormElement>;
    handleSubmit(mockEvent);
  }, [query]);

  return (
    <div
      className={`flex w-full h-full ${
        isIframeShown ? "flex-row" : "flex-col"
      }`}
    >
      {isIframeShown && (
        <iframe
          src={data.caseUrl}
          className="w-1/2 h-full"
          title="Case Details"
        ></iframe>
      )}

      <div
        className={`w-full h-full ${
          isIframeShown ? "w-1/2" : "w-full"
        } overflow-y-auto`}
      >
        <ResultCard data={data} onReadCaseClick={onToggleIframe} />
        <ChatMessages key={data.id} messages={messages} />
        <div className="mb-1 relative p-3 border-t flex-none">
          <form onSubmit={handleSubmit}>
            <div className="flex-row space-x-2">
              <input
                className="resize-none overflow-auto max-h-24 border rounded w-full p-3 pl-3 pr-20 text-gray-200 leading-tight bg-black border-gray-700 duration-200 h-20"
                value={input}
                onChange={handleInputChange}
              ></input>

              <span className="absolute inset-y-0 right-5 flex items-center pr-3 pointer-events-none text-gray-400">
                <div className="h-3 w-3">⮐</div>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatComponentReady;
