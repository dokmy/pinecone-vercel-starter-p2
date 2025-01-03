"use client";

import { useChat } from "ai/react";
import { Message } from "ai";
import { useState } from "react";
import MessageContent from "./components/MessageContent";

interface SearchResult {
  url: string;
  title: string;
  snippet: string;
}

interface ExtendedMessage extends Message {
  searchResults?: SearchResult[];
}

export default function ListingRules() {
  const [messageSearchResults, setMessageSearchResults] = useState<
    Record<string, SearchResult[]>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/listing-rules/chat",
      onFinish: () => setIsSubmitting(false),
    });

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsSubmitting(true);

    try {
      const searchResponse = await fetch(
        `/api/listing-rules/chat?query=${encodeURIComponent(input)}`
      );
      const results = await searchResponse.json();

      const tempMessageId = Date.now().toString();
      setMessageSearchResults((prev) => ({
        ...prev,
        [tempMessageId]: results,
      }));

      handleSubmit(e);
    } catch (error) {
      console.error("Error during submission:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)]">
      <div className="relative h-full">
        <div className="overflow-y-auto h-[calc(100%-4rem)] pt-2 pb-8">
          <div className="max-w-4xl mx-auto px-4 space-y-4">
            {messages.map((message, index) => (
              <MessageContent
                key={index}
                message={
                  {
                    ...message,
                    searchResults:
                      message.role === "assistant"
                        ? Object.values(messageSearchResults)[
                            Math.floor(index / 2)
                          ]
                        : undefined,
                  } as ExtendedMessage
                }
              />
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-black border-t border-gray-800">
          <div className="max-w-4xl mx-auto h-full px-4 flex items-center">
            <form
              onSubmit={handleFormSubmit}
              className="flex gap-x-2 w-full py-3"
            >
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about HKEX listing rules..."
                className="flex-1 bg-[#1C1C1C] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2.5 rounded-lg bg-blue-500 text-white font-medium min-w-[80px] flex items-center justify-center ${
                  isSubmitting
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-600"
                }`}
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Send"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
