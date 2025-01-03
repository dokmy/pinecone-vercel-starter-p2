"use client";

import { useChat } from "ai/react";
import { Message } from "ai";
import { useState } from "react";
import MessageContent from "./components/MessageContent";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface SearchResult {
  url: string;
  title: string;
  snippet: string;
}

interface ExtendedMessage extends Message {
  searchResults?: SearchResult[];
}

const sampleQuestions = [
  "What are the requirements for listing on the Main Board?",
  "Explain the profit requirement for listing application",
  "What are the continuing obligations for listed companies?",
  "What is the minimum public float requirement?",
];

function WelcomeScreen({ onSelect }: { onSelect: (question: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <BookOpen className="h-12 w-12 text-blue-500 mb-4" />
      <h1 className="text-2xl font-bold mb-2">HKEX Listing Rules Assistant</h1>
      <p className="text-gray-400 mb-8 max-w-md">
        Ask any questions about Hong Kong Stock Exchange listing rules.
        I&apos;ll help you find relevant information and explain the
        requirements.
      </p>
      <div className="w-full max-w-4xl grid grid-cols-2 gap-2">
        {sampleQuestions.map((question, index) => (
          <button
            key={index}
            onClick={() => onSelect(question)}
            className="text-left p-3 text-sm bg-[#1C1C1C] hover:bg-[#2C2C2C] rounded-lg transition-colors"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ListingRules() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageSearchResults, setMessageSearchResults] = useState<{
    [key: number]: SearchResult[];
  }>({});

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setInput,
  } = useChat({
    api: "/api/listing-rules/chat",
    onFinish: () => setIsSubmitting(false),
    onError: (error) => {
      setIsSubmitting(false);
      if (error?.message?.includes("403")) {
        toast("Not enough credits. Please upgrade or buy more.");
      } else {
        toast.error("An error occurred. Please try again.");
      }
    },
  });

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsSubmitting(true);

    try {
      const searchResponse = await fetch(
        `/api/listing-rules/chat?query=${encodeURIComponent(input)}`
      );

      if (searchResponse.status === 403) {
        toast("Not enough credits. Please upgrade or buy more.");
        setIsSubmitting(false);
        return;
      }

      if (!searchResponse.ok) {
        const error = await searchResponse.json();
        throw new Error(error.message || "Search failed");
      }

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
      toast.error("Failed to search listing rules. Please try again.");
    }
  };

  const handleSampleQuestionSelect = (question: string) => {
    setInput(question);
  };

  return (
    <div className="h-[calc(100vh-4rem)]">
      <div className="relative h-full">
        <div className="overflow-y-auto h-[calc(100%-4rem)] pt-2">
          <div className="max-w-4xl mx-auto px-4 space-y-4 h-full">
            {messages.length === 0 ? (
              <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
                <WelcomeScreen onSelect={handleSampleQuestionSelect} />
              </div>
            ) : (
              <>
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
                <div className="h-36" />
              </>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent">
          <div className="max-w-4xl mx-auto">
            <form
              onSubmit={handleFormSubmit}
              className="flex gap-x-2 w-full p-4"
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
            <div className="text-xs text-center text-muted-foreground pb-4">
              HKEX Listing Rules Assistant can make mistakes. Please verify
              information with official HKEX sources.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
