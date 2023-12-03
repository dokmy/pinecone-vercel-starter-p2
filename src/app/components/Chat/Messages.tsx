import { Message } from "ai";
import { useRef } from "react";

export default function Messages({ messages }: { messages: Message[] }) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  return (
    <div className="overflow-y-auto flex flex-col bg-gray-700 leading-7">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`${
            // msg.role === "assistant" ? "text-green-300" : "text-blue-300"
            msg.role === "assistant" ? "bg-gray-800" : "bg-gray-600"
          }  px-3 py-3 shadow-md hover:shadow-lg transition-shadow duration-200 flex slide-in-bottom border-b message-glow`}
        >
          <div
            className={`pr-3 border-r border-gray-500 flex items-center ${
              msg.role === "assistant" ? "bg-gray-800" : "bg-gray-600"
            }`}
          >
            {msg.role === "assistant" ? "🤖" : "🧑‍💻"}
          </div>
          <div className="ml-4 flex items-center text-gray-200 pr-7">
            {msg.content}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
