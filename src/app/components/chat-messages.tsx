import { Message } from "ai";
import { useState } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DoneIcon from "@mui/icons-material/Done";

export default function Messages({ messages }: { messages: Message[] }) {
  const [copiedIndices, setCopiedIndices] = useState<{
    [key: number]: boolean;
  }>({});

  const handleIconClick = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndices((prev) => ({ ...prev, [index]: true }));
      setTimeout(() => {
        setCopiedIndices((prev) => ({ ...prev, [index]: false }));
      }, 1000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <div className="flex flex-col bg-gray-700 leading-7 overflow-y-auto">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`group ${
            msg.role === "assistant" ? "bg-[#18181A]" : "bg-[#18181A]"
          }  px-3 py-3 shadow-md hover:shadow-lg transition-shadow duration-200 flex slide-in-bottom border-b message-glow`}
        >
          <div
            className={`pr-3 border-r border-gray-500 flex items-center ${
              msg.role === "assistant" ? "bg-[#18181A]" : "bg-[#18181A]"
            }`}
          >
            {msg.role === "assistant" ? "🤖" : "🧑‍💻"}
          </div>
          <div className="ml-4 flex flex-col items-center text-gray-200 pr-7">
            {msg.content.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                <br></br>
              </span>
            ))}
          </div>
          <div
            onClick={() => handleIconClick(msg.content, index)}
            className="cursor-pointer"
          >
            {copiedIndices[index] ? (
              <DoneIcon
                className="text-white text-lg"
                style={{ fontSize: "16px" }}
              />
            ) : (
              <ContentCopyIcon
                className="text-white text-lg"
                style={{ fontSize: "16px" }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
