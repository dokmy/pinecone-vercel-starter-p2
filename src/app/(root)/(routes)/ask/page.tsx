"use client";

import { useChat } from "ai/react";
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import clsx from "clsx";
import {
  VercelIcon,
  GithubIcon,
  LoadingCircle,
  SendIcon,
} from "@/components/icons";
import { Bot, User } from "lucide-react";
import remarkGfm from "remark-gfm";
import Textarea from "react-textarea-autosize";

const examples = [
  "My client has a personal injury during lunch time at work. Is he eligbale for compensation from his employer?",
  "If I receive writ today, when do I have to file acknowledgment of service?",
  "In personal injuries cases, is there any obligation or duty for the defendant to disclose the information of its insurer? ",
  "Find me cases where the plaintiff suffered vertebral fracture and let me know the PSLA figure",
];

export default function Chat() {
  // create a sources array with useState hook
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, input, setInput, handleSubmit, isLoading, setMessages } =
    useChat({
      api: "/api/ccc-engine",
    });

  const disabled = isLoading || input.length === 0;

  const helperHandleSumbit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessages([]);
    handleSubmit(e);
  };

  return (
    <main className="flex flex-col items-center justify-between pb-40">
      <div className="flex-1 overflow-y-auto sm:p-5 w-full sm:w-3/4">
        {messages.length > 0 ? (
          messages.map((message, i) => (
            <div
              key={i}
              className={clsx(
                "flex w-full items-center justify-center border-b border-gray-200 py-8",
                message.role === "user"
                  ? "bg-transparent text-xl sm:text-2xl font-semibold"
                  : "bg-transparent"
              )}
            >
              <div className="flex w-full max-w-screen-md items-start space-x-4 px-5 sm:px-0">
                <div
                  className={clsx(
                    "p-1.5 text-white",
                    message.role === "assistant" ? "bg-green-500" : "bg-black"
                  )}
                >
                  {message.role === "user" ? (
                    <User width={20} />
                  ) : (
                    <Bot width={20} />
                  )}
                </div>
                <ReactMarkdown
                  className="prose mt-1 w-full break-words prose-p:leading-relaxed"
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // open links in new tab
                    a: (props) => (
                      <a
                        {...props}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#007bff",
                          textDecoration: "underline",
                        }}
                      />
                    ),
                    p: (props) => (
                      <p {...props} style={{ marginBottom: "1rem" }} />
                    ),

                    // add margin bottom to headings
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
                    h4: (props) => (
                      <h4
                        {...props}
                        style={{ marginBottom: "1rem", fontSize: "0.875rem" }}
                      />
                    ),
                    h5: (props) => (
                      <h5
                        {...props}
                        style={{ marginBottom: "1rem", fontSize: "0.75rem" }}
                      />
                    ),
                    h6: (props) => (
                      <h6
                        {...props}
                        style={{ marginBottom: "1rem", fontSize: "0.75rem" }}
                      />
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          ))
        ) : (
          // <div className="mx-5 mt-5 max-w-screen-md rounded-md border border-gray-200 sm:mx-0 sm:w-full">
          <div className="mt-5 rounded-md border border-gray-200">
            <div className="flex flex-col space-y-4 p-7 sm:p-10">
              <h1 className="text-lg font-semibold text-white">
                Welcome to Chat!
              </h1>
              <p className="text-gray-500">
                This is a legal chatbot. I am trained on the Hong Kong
                Legislation and Judgment Database. Please note that answers
                might be wrong or inaccurate. Please use this chatbot for
                informational purposes only. Below are some sample questions or
                you can come up with your own in the chatbox.
              </p>
            </div>
            <div className="flex flex-col space-y-4 border-t border-gray-200 bg-gray-50 p-7 sm:p-10">
              {examples.map((example, i) => (
                <button
                  key={i}
                  className="rounded-md border border-gray-200 bg-white px-5 py-3 text-left text-sm text-gray-500 transition-all duration-75 hover:border-black hover:text-gray-700 active:bg-gray-50"
                  onClick={() => {
                    setInput(example);
                    inputRef.current?.focus();
                  }}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 flex w-full pb-3 sm:w-2/3 flex-col items-center p-2 space-y-3 sm:px-0 bg-black">
        <form
          ref={formRef}
          onSubmit={helperHandleSumbit}
          className="relative w-full max-w-screen-md rounded-xl border px-4 pb-2 pt-3 shadow-lg sm:pb-3 sm:pt-4 bg-black"
        >
          <Textarea
            ref={inputRef}
            tabIndex={0}
            required
            rows={1}
            autoFocus
            placeholder="Send a message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                formRef.current?.requestSubmit();
                e.preventDefault();
              }
            }}
            spellCheck={false}
            className="w-full pr-10 focus:outline-none bg-transparent"
          />
          <button
            className={clsx(
              "absolute inset-y-0 right-3 my-auto flex h-8 w-8 items-center justify-center rounded-md transition-all",
              disabled
                ? "cursor-not-allowed bg-white"
                : "bg-green-500 hover:bg-green-600"
            )}
            disabled={disabled}
          >
            {isLoading ? (
              <LoadingCircle />
            ) : (
              <SendIcon
                className={clsx(
                  "h-4 w-4",
                  input.length === 0 ? "text-gray-300" : "text-white"
                )}
              />
            )}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400">
          Answers might be wrong or inaccurate. Please use this chatbot for
          informational purposes only.
        </p>
      </div>
    </main>
  );
}
