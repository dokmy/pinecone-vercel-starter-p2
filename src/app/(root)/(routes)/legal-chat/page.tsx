"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Send,
  Loader2,
  Bot,
  User,
  Search,
  Brain,
  ChevronDown,
  ChevronRight,
  FileText,
  Scale
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CaseViewer } from "./components/CaseViewer";

interface ToolCall {
  name: string;
  args: any;
  result?: any;
}

interface ThinkingStep {
  type: "thinking" | "tool_call" | "tool_result";
  content: string;
  toolCall?: ToolCall;
  timestamp: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinkingSteps?: ThinkingStep[];
  isStreaming?: boolean;
}

interface OpenCase {
  url: string;
  caseName: string;
}

export default function LegalChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState<Set<string>>(new Set());
  const [openCase, setOpenCase] = useState<OpenCase | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleThinking = (messageId: string) => {
    setExpandedThinking(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  // Handle clicking on case links
  const handleCaseClick = useCallback((url: string, caseName: string) => {
    setOpenCase({ url, caseName });
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      thinkingSteps: [],
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsLoading(true);

    // Auto-expand thinking for new message
    setExpandedThinking(prev => new Set(prev).add(assistantMessageId));

    try {
      const response = await fetch("/api/legal-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Response body is null");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              setMessages(prev => prev.map(m =>
                m.id === assistantMessageId
                  ? { ...m, isStreaming: false }
                  : m
              ));
              continue;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === "thinking") {
                setMessages(prev => prev.map(m => {
                  if (m.id === assistantMessageId) {
                    return {
                      ...m,
                      thinkingSteps: [
                        ...(m.thinkingSteps || []),
                        {
                          type: "thinking",
                          content: parsed.content,
                          timestamp: new Date().toLocaleTimeString(),
                        }
                      ],
                    };
                  }
                  return m;
                }));
              } else if (parsed.type === "tool_call") {
                setMessages(prev => prev.map(m => {
                  if (m.id === assistantMessageId) {
                    return {
                      ...m,
                      thinkingSteps: [
                        ...(m.thinkingSteps || []),
                        {
                          type: "tool_call",
                          content: `Calling tool: ${parsed.name}`,
                          toolCall: { name: parsed.name, args: parsed.args },
                          timestamp: new Date().toLocaleTimeString(),
                        }
                      ],
                    };
                  }
                  return m;
                }));
              } else if (parsed.type === "tool_result") {
                setMessages(prev => prev.map(m => {
                  if (m.id === assistantMessageId) {
                    return {
                      ...m,
                      thinkingSteps: [
                        ...(m.thinkingSteps || []),
                        {
                          type: "tool_result",
                          content: parsed.summary || "Tool completed",
                          timestamp: new Date().toLocaleTimeString(),
                        }
                      ],
                    };
                  }
                  return m;
                }));
              } else if (parsed.type === "content") {
                setMessages(prev => prev.map(m => {
                  if (m.id === assistantMessageId) {
                    return {
                      ...m,
                      content: m.content + parsed.content,
                    };
                  }
                  return m;
                }));
              } else if (parsed.type === "final") {
                setMessages(prev => prev.map(m => {
                  if (m.id === assistantMessageId) {
                    return {
                      ...m,
                      content: parsed.content,
                      isStreaming: false,
                    };
                  }
                  return m;
                }));
              }
            } catch (e) {
              console.error("Failed to parse SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => prev.map(m => {
        if (m.id === assistantMessageId) {
          return {
            ...m,
            content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            isStreaming: false,
          };
        }
        return m;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Reset height to auto to get the correct scrollHeight
    e.target.style.height = 'auto';
    // Set new height based on scrollHeight, with min and max limits
    const newHeight = Math.min(Math.max(e.target.scrollHeight, 60), 200);
    e.target.style.height = `${newHeight}px`;
  };

  const renderThinkingStep = (step: ThinkingStep, idx: number) => {
    if (step.type === "thinking") {
      return (
        <div key={idx} className="flex items-start gap-2 text-sm text-gray-400 min-w-0">
          <Brain className="w-4 h-4 mt-0.5 text-purple-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="text-gray-500 text-xs">{step.timestamp}</span>
            <p className="text-gray-300 break-words">{step.content}</p>
          </div>
        </div>
      );
    } else if (step.type === "tool_call") {
      return (
        <div key={idx} className="flex items-start gap-2 text-sm min-w-0">
          <Search className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="text-gray-500 text-xs">{step.timestamp}</span>
            <p className="text-blue-300 font-medium">{step.content}</p>
            {step.toolCall && (
              <pre className="mt-1 text-xs bg-gray-900 p-2 rounded overflow-hidden whitespace-pre-wrap break-all">
                {JSON.stringify(step.toolCall.args, null, 2)}
              </pre>
            )}
          </div>
        </div>
      );
    } else if (step.type === "tool_result") {
      return (
        <div key={idx} className="flex items-start gap-2 text-sm min-w-0">
          <FileText className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="text-gray-500 text-xs">{step.timestamp}</span>
            <p className="text-green-300 break-words">{step.content}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Check if a URL is a case link (hklii.hk)
  const isCaseUrl = (url: string) => {
    return url.includes("hklii.hk/en/cases/");
  };

  // Extract case name from link text
  const extractCaseName = (children: React.ReactNode): string => {
    if (typeof children === "string") return children;
    if (Array.isArray(children)) {
      return children.map(extractCaseName).join("");
    }
    if (children && typeof children === "object" && "props" in children) {
      return extractCaseName((children as any).props.children);
    }
    return "Case Document";
  };

  return (
    <div className="h-full w-full flex overflow-hidden">
      {/* Chat Panel */}
      <div className={`h-full flex flex-col transition-all duration-300 overflow-hidden ${openCase ? 'w-1/2' : 'w-full max-w-4xl mx-auto'}`}>
        {/* Header - fixed at top */}
        <div className="flex-shrink-0 p-4 pb-2">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="w-7 h-7 text-cyan-400" />
            Legal Assistant
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Ask questions about Hong Kong law. Click on case links to view them in the panel.
          </p>
        </div>

        {/* Messages - scrollable, no horizontal scroll */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 px-4 min-h-0">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <Bot className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-lg">Start a conversation</p>
              <p className="text-sm mt-2">
                Try asking about personal injury cases, legal precedents, or general Hong Kong law questions.
              </p>
              <div className="mt-6 space-y-2">
                <p className="text-xs text-gray-600">Example questions:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    "Find PI cases involving shoulder injuries for a chef",
                    "What factors affect PSLA awards in HK?",
                    "How are loss of earnings calculated?",
                  ].map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(q)}
                      className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-full text-gray-300"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              <div className={`max-w-[80%] ${message.role === "user" ? "order-first" : ""}`}>
                {/* Thinking Process (for assistant messages) */}
                {message.role === "assistant" && message.thinkingSteps && message.thinkingSteps.length > 0 && (
                  <div className="mb-2">
                    <button
                      onClick={() => toggleThinking(message.id)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 mb-1"
                    >
                      {expandedThinking.has(message.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <Brain className="w-3 h-3" />
                      Thinking Process ({message.thinkingSteps.length} steps)
                    </button>

                    {expandedThinking.has(message.id) && (
                      <Card className="bg-gray-800/50 border-gray-700 mb-2">
                        <CardContent className="p-3 space-y-2">
                          {message.thinkingSteps.map((step, idx) => renderThinkingStep(step, idx))}
                          {message.isStreaming && (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-sm">Processing...</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Message Content */}
                <div
                  className={`rounded-lg px-4 py-3 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-100"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-invert prose-sm max-w-none [&_table]:!border-collapse [&_table]:!border-spacing-0">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ href, children }) => {
                            const url = href || "";
                            const caseName = extractCaseName(children);

                            if (isCaseUrl(url)) {
                              return (
                                <button
                                  onClick={() => handleCaseClick(url, caseName)}
                                  className="text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-1 text-left"
                                >
                                  <Scale className="w-3 h-3 flex-shrink-0" />
                                  {children}
                                </button>
                              );
                            }

                            return (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 underline"
                              >
                                {children}
                              </a>
                            );
                          },
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-amber-500 bg-amber-950/30 pl-4 py-2 my-3 italic text-amber-100">
                              {children}
                            </blockquote>
                          ),
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li>{children}</li>,
                          strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-base font-bold mt-2 mb-1">{children}</h3>,
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-4 not-prose">
                              <table className="min-w-full border-collapse border border-gray-600 text-sm bg-gray-900">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({ children }) => <thead className="bg-gray-700">{children}</thead>,
                          tbody: ({ children }) => <tbody className="bg-gray-800">{children}</tbody>,
                          tr: ({ children }) => <tr className="border-b border-gray-600">{children}</tr>,
                          th: ({ children }) => <th className="px-3 py-2 text-left font-semibold border border-gray-600 text-white">{children}</th>,
                          td: ({ children }) => <td className="px-3 py-2 border border-gray-600 text-gray-300">{children}</td>,
                        }}
                      >
                        {message.content || (message.isStreaming ? "..." : "")}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Input - fixed at bottom */}
        <div className="flex-shrink-0 border-t border-gray-700 p-4 bg-gray-900">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask a legal question..."
              className="flex-1 bg-gray-800 border-gray-600 text-white resize-none overflow-y-auto"
              style={{ height: '60px', minHeight: '60px', maxHeight: '200px' }}
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="self-end"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Case Viewer Panel */}
      {openCase && (
        <div className="w-1/2 h-full overflow-hidden">
          <CaseViewer
            url={openCase.url}
            caseName={openCase.caseName}
            onClose={() => setOpenCase(null)}
          />
        </div>
      )}
    </div>
  );
}
