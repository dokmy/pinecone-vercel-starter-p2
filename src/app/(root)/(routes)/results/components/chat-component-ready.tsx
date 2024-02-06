"use client";
import React from "react";
import ResultCard from "@/components/result-card";
import ChatMessages from "@/components/chat-messages";
import { useChat } from "ai/react";
import { Message } from "ai";
import { useEffect, useRef } from "react";
import MoonLoader from "react-spinners/MoonLoader";
import { Button } from "@/components/ui/button";

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

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // const scrollToBottom = () => {
  //   if (endOfMessagesRef.current) {
  //     const scrollContainer = endOfMessagesRef.current.parentElement;
  //     if (scrollContainer) {
  //       // Set the scrollTop to the bottom of the container
  //       scrollContainer.scrollTop = scrollContainer.scrollHeight;
  //     }
  //   }
  //   // endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  // };

  // console.log("CCR is here. Here is the real chatArgs: ", chatArgs);

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      ...chatArgs,
      body: { filter: data.caseNeutralCit, searchResultId: data.id },
    });

  useEffect(() => {
    const mockEvent = {
      preventDefault: () => {},
    } as unknown as React.FormEvent<HTMLFormElement>;
    handleSubmit(mockEvent);
  }, [query]);

  // useEffect(() => {
  //   setTimeout(scrollToBottom, 100);
  // }, [messages]);

  return (
    <div
      className={`flex ${
        isIframeShown
          ? "flex-col sm:flex-row sm:h-[calc(100vh-64px-73px)]"
          : "flex-col h-[calc(100vh-64px-73px)]"
      } `}
    >
      {isIframeShown && (
        <iframe
          src={data.caseUrl}
          className="w-screen h-[65vh] sm:w-1/2 sm:h-full flex-none"
          title="Case Details"
        ></iframe>
      )}

      <div
        className={`h-full overflow-y-scroll ${
          isIframeShown ? "w-full sm:w-1/2" : "w-full"
        }`}
      >
        <div className="w-full sticky top-0 bg-black">
          <ResultCard data={data} onReadCaseClick={onToggleIframe} />
        </div>

        <div className="flex-1">
          <ChatMessages
            key={data.id}
            messages={messages}
            endOfMessagesRef={endOfMessagesRef}
          />
        </div>

        <div className="w-full p-3 border-t bg-gray-900 sticky bottom-0">
          <form onSubmit={handleSubmit}>
            <div className="relative w-full">
              <input
                className="resize-none overflow-auto max-h-24 border rounded w-full p-3 pl-3 pr-20 text-gray-200 leading-tight bg-black border-gray-700 duration-200 h-20"
                value={input}
                onChange={handleInputChange}
                disabled={isLoading}
              ></input>

              <span className="absolute inset-y-0 right-5 flex items-center pr-3 pointer-events-none text-gray-400">
                {isLoading ? (
                  <MoonLoader
                    color="#36d7b7"
                    loading={isLoading}
                    size={20} // Adjust size as needed
                    aria-label="Loading Spinner"
                    data-testid="loader"
                  />
                ) : (
                  <div className="h-3 w-3">⮐</div>
                )}
              </span>
            </div>
          </form>
        </div>
        {/* <div ref={endOfMessagesRef} /> */}
      </div>
    </div>
  );
};

export default ChatComponentReady;
