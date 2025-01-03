"use client";
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { useChat } from "ai/react";
import { Message } from "ai";
import ChatResultCard from "../components/2-chat-result-card";
import ChatMessages from "@/components/chat-messages";
import MoonLoader from "react-spinners/MoonLoader";

interface ApiSearchResult {
  id: string;
  caseName: string;
  caseNeutralCit: string;
  caseActionNo: string;
  caseDate: string | Date;
  caseUrl: string;
  createdAt: string | Date;
  searchId: string;
  userId: string;
}

interface FormattedSearchResult {
  id: string;
  caseName: string;
  caseNeutralCit: string;
  caseActionNo: string;
  caseDate: Date;
  caseUrl: string;
  createdAt: Date;
  searchId: string;
  userId: string;
}

const ChatPage = () => {
  const params = useParams() as { chatId: string };
  const chatId = params.chatId;
  const [searchResult, setSearchResult] =
    useState<FormattedSearchResult | null>(null);
  const [dbMessages, setDbMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.post(`/api/2-get-messages`, {
          searchResultId: chatId,
        });
        const { searchResult, messages } = response.data;
        console.log("Fetched data:", { searchResult, messages }); // Debug log

        if (searchResult) {
          // Convert date strings to Date objects
          const formattedSearchResult: FormattedSearchResult = {
            ...searchResult,
            caseDate: new Date(searchResult.caseDate),
            createdAt: new Date(searchResult.createdAt),
          };
          setSearchResult(formattedSearchResult);
        } else {
          setError("No search result found for this chat.");
        }

        if (messages && messages.length > 0) {
          setDbMessages(messages);
        } else {
          console.warn("No messages found for this chat.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load chat data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [chatId]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: isChatLoading,
  } = useChat({
    initialMessages: dbMessages,
    body: {
      filter: searchResult?.caseNeutralCit,
      searchResultId: chatId,
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)]">
        <MoonLoader color="#ffffff" size={50} />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  if (!searchResult) {
    return (
      <div className="text-center p-4">
        No case data found. ChatId: {chatId}
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="w-1/2 h-full">
        <iframe
          src={searchResult.caseUrl}
          className="w-full h-full"
          title="Case Details"
        />
      </div>
      <div className="w-1/2 h-full flex flex-col">
        <div className="sticky top-0 bg-black z-10">
          <ChatResultCard data={searchResult} />
        </div>
        <div className="flex-grow overflow-y-auto">
          <ChatMessages
            messages={messages}
            endOfMessagesRef={endOfMessagesRef}
          />
        </div>
        <div className="w-full p-3 border-t bg-gray-900">
          <form onSubmit={handleSubmit}>
            <div className="relative w-full">
              <input
                className="resize-none overflow-auto max-h-24 border rounded w-full p-3 pl-3 pr-20 text-gray-200 leading-tight bg-black border-gray-700 duration-200 h-20"
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                disabled={isChatLoading}
              />
              <span className="absolute inset-y-0 right-5 flex items-center pr-3 pointer-events-none text-gray-400">
                {isChatLoading ? (
                  <MoonLoader color="#36d7b7" size={20} />
                ) : (
                  <div className="h-3 w-3">⮐</div>
                )}
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
