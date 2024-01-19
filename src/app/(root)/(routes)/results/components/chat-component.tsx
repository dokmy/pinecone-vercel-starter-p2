"use client";
import React from "react";
import axios from "axios";
import { useEffect, useState } from "react";
import ChatComponentReady from "./chat-component-ready";
import { Message } from "ai";
import Image from "next/image";
import FastLegalLogo from "public/logo_rec.png";

interface ChatComponentProps {
  data: {
    id: string;
    caseName: string;
    caseNeutralCit: string;
    caseActionNo: string;
    caseDate: Date;
    caseUrl: string;
    createdAt: Date;
    searchId: string;
    userId: string;
  };
  query: string;
  isIframeShown: boolean;
  onToggleIframe: () => void;
}

interface chatArgs {
  initialInput?: string;
  initialMessages?: Message[];
}

const ChatComponent: React.FC<ChatComponentProps> = ({
  data,
  query,
  isIframeShown,
  onToggleIframe,
}) => {
  const [dbMessages, setDbMessages] = useState<null | []>(null);
  const [chatArgs, setChatArgs] = useState<null | chatArgs>(null);

  useEffect(() => {
    const fetchDbMessages = async () => {
      try {
        const response = await axios.post(`/api/get-messages`, {
          searchResultId: data.id,
        });
        setDbMessages(response.data);
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
      console.log("no messages. Adding initial input.");
      setChatArgs({
        initialInput:
          "Please first summarise this case for me and then explain why this case is relevant to my situation as follow: " +
          query,
      });
    } else {
      console.log("Have messages. Adding initial messages.");
      const simplifiedMessages = dbMessages.map(({ id, role, content }) => ({
        id,
        role,
        content,
      }));
      console.log("DBMESSAGES ARE HERE: ", dbMessages);
      setChatArgs({ initialMessages: simplifiedMessages });
      // setInitialInput("");
    }
  }, [dbMessages, query]);

  if (chatArgs == null) {
    return (
      // <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="animate-bounce justify-center items-center text-center">
        <Image
          src={FastLegalLogo}
          alt="fastlegal-logo"
          width="170"
          height="50"
          className="ml-3 my-1"
        />
        Loading results...
      </div>
      // </div>
    );
  }

  return (
    <ChatComponentReady
      data={data}
      query={query}
      chatArgs={chatArgs}
      isIframeShown={isIframeShown}
      onToggleIframe={onToggleIframe}
    />
  );
};

export default ChatComponent;
