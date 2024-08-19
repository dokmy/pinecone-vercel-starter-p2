"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import ChatMessages from "./2-chat-messages";
import ResultCard from "./2-result-card";
import { useChat } from "ai/react";
import { Message } from "ai";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import MoonLoader from "react-spinners/MoonLoader";

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
  countryOption: string;
}

interface chatArgs {
  initialInput?: string;
  initialMessages?: Message[];
}

const ChatComponentReady: React.FC<ChatComponentReadyProps> = (props) => {
  const { data, query, chatArgs, countryOption } = props;

  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  console.log("ChatComponentReady - Rendering with props:", {
    data,
    query,
    chatArgs,
    countryOption,
  });

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      ...chatArgs,
      body: {
        filter: data.caseNeutralCit,
        searchResultId: data.id,
        countryOption: countryOption,
      },
      onResponse: (response) => {
        console.log("onResponse - status:", response.status);
        if (response.status === 403) {
          toast("Not enough credits. Please upgrade or buy more.");
          router.push(`/settings`);
        }
      },
    });

  useEffect(() => {
    console.log("ChatComponentReady - useEffect for initial query");
    const mockEvent = {
      preventDefault: () => {},
    } as unknown as React.FormEvent<HTMLFormElement>;
    console.log("Submitting initial query");
    handleSubmit(mockEvent);
  }, [query]);

  useEffect(() => {
    console.log("ChatComponentReady - messages changed:", messages);
  }, [messages]);

  useEffect(() => {
    console.log("ChatComponentReady - isLoading changed:", isLoading);
  }, [isLoading]);

  const handleChatWithCase = () => {
    window.open(`/chat/${data.id}`, "_blank");
  };

  // Find the first (earliest) assistant message
  const firstAssistantMessage = useMemo(() => {
    const assistantMessages = messages.filter(
      (msg) => msg.role === "assistant"
    );
    console.log("First assistant message:", assistantMessages[0]);
    if (assistantMessages.length === 0) return null;

    return assistantMessages.reduce((earliest, current) => {
      const earliestDate = earliest.createdAt
        ? new Date(earliest.createdAt).getTime()
        : Infinity;
      const currentDate = current.createdAt
        ? new Date(current.createdAt).getTime()
        : Infinity;
      return currentDate < earliestDate ? current : earliest;
    });
  }, [messages]);

  console.log("ChatComponentReady render - isLoading:", isLoading);

  return (
    <div className="flex flex-col h-full bg-gray-800 p-4 rounded-lg">
      <div className="w-full h-full overflow-y-auto">
        <ResultCard data={data} />
        <div className="mt-2">
          {isLoading ? (
            <div className="flex text-white py-2 px-4 rounded">
              <MoonLoader
                color="#ffffff"
                loading={true}
                size={20}
                aria-label="Loading Spinner"
                data-testid="loader"
              />
              <span className="ml-2">Generating response...</span>
            </div>
          ) : (
            <Button
              onClick={handleChatWithCase}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Chat with Case
            </Button>
          )}
        </div>
        <div className="mt-2">
          <ChatMessages
            key={data.id}
            messages={firstAssistantMessage ? [firstAssistantMessage] : []}
            endOfMessagesRef={endOfMessagesRef}
            isExpanded={isExpanded}
            onToggleExpand={() => setIsExpanded(!isExpanded)}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatComponentReady;
