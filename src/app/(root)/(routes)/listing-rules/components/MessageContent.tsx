// src/app/(root)/(routes)/listing-rules/components/MessageContent.tsx
"use client";

import { Message } from "ai";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
        <div className="prose mt-1 w-full break-words prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: (props) => (
                <a
                  {...props}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#60A5FA",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                />
              ),
              p: (props) => (
                <p
                  {...props}
                  style={{
                    marginBottom: "1rem",
                    overflowWrap: "break-word",
                    wordWrap: "break-word",
                    hyphens: "auto",
                  }}
                />
              ),
              h1: (props) => (
                <h1
                  {...props}
                  style={{
                    marginBottom: "1rem",
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                  }}
                />
              ),
              h2: (props) => (
                <h2
                  {...props}
                  style={{ marginBottom: "1rem", fontSize: "1.25rem" }}
                />
              ),
              h3: (props) => (
                <h3
                  {...props}
                  style={{ marginBottom: "1rem", fontSize: "1rem" }}
                />
              ),
              pre: (props) => (
                <pre
                  {...props}
                  style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                />
              ),
              code: ({ node, inline, className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <pre className="bg-gray-800 rounded p-4 my-4 overflow-x-auto whitespace-pre-wrap break-words">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                ) : (
                  <code
                    className={`${className} px-1 py-0.5 rounded bg-gray-800`}
                    style={{ wordBreak: "break-word" }}
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              table: (props) => (
                <div className="overflow-x-auto my-4">
                  <table
                    {...props}
                    className="min-w-full divide-y divide-gray-700"
                  />
                </div>
              ),
              th: (props) => (
                <th
                  {...props}
                  className="px-4 py-2 bg-gray-800 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                />
              ),
              td: (props) => (
                <td
                  {...props}
                  className="px-4 py-2 text-sm text-gray-300 border-t border-gray-700"
                />
              ),
              blockquote: (props) => (
                <blockquote
                  {...props}
                  className="border-l-4 border-gray-700 pl-4 my-4 italic text-gray-400"
                />
              ),
              ol: (props) => (
                <ol
                  {...props}
                  className="list-decimal list-outside ml-6 space-y-2 my-4"
                />
              ),
              ul: (props) => (
                <ul
                  {...props}
                  className="list-disc list-outside ml-6 space-y-2 my-4"
                />
              ),
              li: (props) => (
                <li {...props} className="pl-2">
                  {props.children}
                </li>
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
