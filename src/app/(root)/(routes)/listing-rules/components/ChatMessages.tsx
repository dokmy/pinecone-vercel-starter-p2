// src/app/(root)/(routes)/listing-rules/components/ChatMessages.tsx
"use client";

import { Message } from "ai";
import MessageContent from "./MessageContent";

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export default function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageContent key={message.id} message={message} />
      ))}
    </div>
  );
}
