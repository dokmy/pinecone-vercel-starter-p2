// src/app/(root)/(routes)/listing-rules/components/MessageContent.tsx
"use client";

import { Message } from "ai";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { ExternalLink } from "lucide-react";

interface SearchResult {
  url: string;
  title: string;
  snippet: string;
}

interface ExtendedMessage extends Message {
  searchResults?: SearchResult[];
}

interface MessageProps {
  message: ExtendedMessage;
}

export default function MessageContent({ message }: MessageProps) {
  return (
    <div
      className={cn(
        "flex w-full items-start gap-x-4 p-4 rounded-xl",
        message.role === "user" ? "bg-[#1C1C1C]" : "bg-[#1C1C1C]",
        "border border-gray-800"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-[30px] h-[30px] rounded-full flex items-center justify-center text-white font-medium",
          message.role === "user" ? "bg-blue-500" : "bg-green-500"
        )}
      >
        {message.role === "user" ? "U" : "A"}
      </div>
      <div className="flex-1">
        {message.role === "assistant" &&
          message.searchResults &&
          message.searchResults.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium text-gray-400 mb-2">
                SOURCES
              </div>
              <div className="space-y-2">
                {message.searchResults.map((result, index) => (
                  <a
                    key={index}
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-lg border border-gray-800 hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-blue-400">
                        {result.title}
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {result.snippet}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        <div className="text-sm text-gray-200 leading-relaxed prose prose-invert max-w-none">
          <ReactMarkdown
            components={{
              a: ({ node, ...props }) => (
                <a
                  {...props}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                />
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
