"use client";
import React from "react";
import axios from "axios";
import { useEffect, useState } from "react";
import ChatComponentReady from "./2-chat-component-ready";
import { Message } from "ai";
import Image from "next/image";
import FastLegalLogo from "public/logo_rec.png";
import { SearchResult } from "../../../../../types";

interface ChatComponentProps {
  data: SearchResult;
  query: string;
  countryOption: string;
  outputLanguage: string;
}

interface chatArgs {
  initialInput?: string;
  initialMessages?: Message[];
}

const ChatComponent: React.FC<ChatComponentProps> = ({
  data,
  query,
  countryOption,
  outputLanguage,
}) => {
  const [dbMessages, setDbMessages] = useState<null | []>(null);
  const [chatArgs, setChatArgs] = useState<null | chatArgs>(null);
  const [isStreaming, setIsStreaming] = useState(true);

  useEffect(() => {
    const fetchDbMessages = async () => {
      try {
        const response = await axios.post(`/api/get-messages`, {
          searchResultId: data.id,
        });
        setDbMessages(response.data);
        console.log("Fetched DB messages:", response.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchDbMessages();
  }, [data.id]);

  useEffect(() => {
    if (dbMessages == null) {
      return;
    }
    if (dbMessages.length === 0) {
      console.log("No messages. Adding initial input.");
      const initialPrompt =
        outputLanguage === "Chinese"
          ? "以下是我的情況或問題。請用中文回答。"
          : "Here is the situation or question: ";
      setChatArgs({
        initialInput: initialPrompt + query,
      });
    } else {
      console.log("Have messages. Adding initial messages.");
      const simplifiedMessages = dbMessages.map(({ id, role, content }) => ({
        id,
        role,
        content,
      }));
      console.log("DBMESSAGES ARE HERE: ", simplifiedMessages);
      setChatArgs({ initialMessages: simplifiedMessages });
    }
  }, [dbMessages, query, outputLanguage]);

  console.log("ChatComponent render - isStreaming:", isStreaming);

  if (chatArgs == null) {
    return (
      <div className="flex flex-col mt-5 animate-bounce justify-center items-center text-center">
        <Image
          src={FastLegalLogo}
          alt="fastlegal-logo"
          width="170"
          height="50"
          className="my-1"
        />
        Loading results...
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <ChatComponentReady
        data={data}
        query={query}
        chatArgs={chatArgs}
        countryOption={countryOption}
      />
    </div>
  );
};

export default ChatComponent;
