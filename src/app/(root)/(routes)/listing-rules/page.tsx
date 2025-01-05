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
  const [selectedParser, setSelectedParser] = useState<"cheerio" | "firecrawl">(
    "cheerio"
  );
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setInput,
  } = useChat({
    api:
      selectedParser === "cheerio"
        ? "/api/listing-rules/chat"
        : "/api/listing-rules-firecrawl",
    onFinish: () => {
      setIsSubmitting(false);
      if (startTime) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log(`✅ Request completed in ${duration}ms`);
        setResponseTime(duration);
      }
    },
    onError: (error) => {
      console.error("❌ Chat error:", error);
      setIsSubmitting(false);
      setStartTime(null);
      if (error?.message?.includes("403")) {
        toast("Not enough credits. Please upgrade or buy more.");
      } else {
        toast.error(`An error occurred: ${error?.message || "Unknown error"}`);
      }
    },
  });

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    console.log(`🚀 Starting request with ${selectedParser} parser`);
    console.log(`📝 Input query: "${input}"`);

    setIsSubmitting(true);
    setStartTime(Date.now());
    setResponseTime(null);

    try {
      const apiUrl = `${
        selectedParser === "cheerio"
          ? "/api/listing-rules/chat"
          : "/api/listing-rules-firecrawl"
      }?query=${encodeURIComponent(input)}`;

      console.log(`📤 Sending request to: ${apiUrl}`);
      const searchResponse = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(`📥 Response status:`, searchResponse.status);

      if (searchResponse.status === 403) {
        console.error("❌ Credit check failed");
        toast("Not enough credits. Please upgrade or buy more.");
        setIsSubmitting(false);
        setStartTime(null);
        return;
      }

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error("❌ Search failed:", {
          status: searchResponse.status,
          statusText: searchResponse.statusText,
          error: errorText,
        });
        throw new Error(errorText || "Search failed");
      }

      const results = await searchResponse.json();
      console.log(`✅ Received ${results.length} search results`);
      console.log("📝 Search results:", results);

      const tempMessageId = Date.now().toString();
      setMessageSearchResults((prev) => ({
        ...prev,
        [tempMessageId]: results,
      }));

      console.log("🤖 Submitting to chat...");
      handleSubmit(e);
    } catch (error: any) {
      console.error("❌ Error during submission:", error);
      setIsSubmitting(false);
      setStartTime(null);
      toast.error(
        `Failed to search listing rules: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
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
            <div className="flex justify-between items-center">
              <select
                value={selectedParser}
                onChange={(e) =>
                  setSelectedParser(e.target.value as "cheerio" | "firecrawl")
                }
                className="bg-[#1C1C1C] text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cheerio">Cheerio Parser</option>
                <option value="firecrawl">Firecrawl Parser</option>
              </select>
              {responseTime && (
                <div className="text-sm text-gray-400">
                  Response time: {(responseTime / 1000).toFixed(2)}s
                </div>
              )}
            </div>
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
