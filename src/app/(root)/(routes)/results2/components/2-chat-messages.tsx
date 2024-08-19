import { Message } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronDown, ChevronUp } from "lucide-react";

interface MessagesProps {
  messages: Message[];
  endOfMessagesRef: React.RefObject<HTMLDivElement>;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export default function Messages({
  messages,
  endOfMessagesRef,
  isExpanded,
  onToggleExpand,
}: MessagesProps) {
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  console.log("ChatMessages render - messages:", messages);

  return (
    <div className="flex flex-col h-full relative">
      <div className={`flex-grow overflow-hidden`}>
        <div className={`h-full overflow-y-auto pb-4`}>
          {messages.map((msg, index) => (
            <div key={index} className="px-3 py-2 border-gray-700">
              <div className="text-gray-200 text-sm">
                <ReactMarkdown
                  className="prose mt-1 w-full break-words prose-p:leading-relaxed prose-p:my-2"
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: (props) => (
                      <a
                        {...props}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                      />
                    ),
                    p: (props) => <p {...props} className="mb-2 break-words" />,
                    h1: (props) => (
                      <h1 {...props} className="text-xl font-bold mb-2" />
                    ),
                    h2: (props) => (
                      <h2 {...props} className="text-lg font-semibold mb-2" />
                    ),
                    h3: (props) => (
                      <h3 {...props} className="text-base font-medium mb-2" />
                    ),
                    h4: (props) => (
                      <h4 {...props} className="text-sm font-medium mb-2" />
                    ),
                    h5: (props) => (
                      <h5 {...props} className="text-sm font-medium mb-2" />
                    ),
                    h6: (props) => (
                      <h6 {...props} className="text-sm font-medium mb-2" />
                    ),
                    pre: (props) => (
                      <pre
                        {...props}
                        className="whitespace-pre-wrap break-words text-sm bg-white text-black p-2 rounded"
                      />
                    ),
                    code: ({ node, inline, className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline && match ? (
                        <pre className="bg-white rounded p-2 my-2 text-black overflow-x-auto whitespace-pre-wrap break-words text-sm">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      ) : (
                        <code
                          className={`${className} px-1 py-0.5 rounded bg-white text-black text-sm`}
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {isExpanded ? msg.content : truncateText(msg.content, 500)}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          {messages.length > 0 && messages[0].content.length > 500 && (
            <div className="mt-2 flex justify-center">
              <button
                onClick={onToggleExpand}
                className="bg-gray-700 text-white rounded-full p-2 shadow-lg hover:bg-gray-600 transition-colors duration-200"
              >
                {isExpanded ? (
                  <ChevronUp className="w-6 h-6" />
                ) : (
                  <ChevronDown className="w-6 h-6" />
                )}
              </button>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>
      </div>
    </div>
  );
}
