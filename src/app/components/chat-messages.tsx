import { Message } from "ai";
import { useState } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DoneIcon from "@mui/icons-material/Done";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessagesProps {
  messages: Message[];
  endOfMessagesRef: React.RefObject<HTMLDivElement>;
}

export default function Messages({
  messages,
  endOfMessagesRef,
}: MessagesProps) {
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
    <div className="flex flex-col bg-gray-700 leading-7 h-full">
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
            <ReactMarkdown
              className="prose mt-1 w-full break-words prose-p:leading-relaxed"
              remarkPlugins={[remarkGfm]}
              components={{
                a: (props) => (
                  <a
                    {...props}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#007bff",
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
                pre: (props) => (
                  <pre
                    {...props}
                    style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                  />
                ),
                code: ({ node, inline, className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <pre className="bg-gray-100 rounded p-4 my-4 text-gray-800 overflow-x-auto whitespace-pre-wrap break-words">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  ) : (
                    <code
                      className={`${className} px-1 py-0.5 rounded bg-gray-200 text-gray-800`}
                      style={{ wordBreak: "break-word" }}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {msg.content}
            </ReactMarkdown>
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
      <div ref={endOfMessagesRef} />
    </div>
  );
}
