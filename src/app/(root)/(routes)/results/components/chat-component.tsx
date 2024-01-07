"use client";
import React from "react";
import ResultCard from "@/components/result-card";
import ChatMessages from "@/components/chat-messages";
import axios from "axios";
import { useEffect, useState } from "react";

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
}

const ChatComponent: React.FC<ChatComponentProps> = ({ data }) => {
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.post("/api/get-messages", {
          searchResultId: data.id,
        });
        setMessages(response.data);
        if (response.data.length === 0) {
          console.log("Messages is empty!");
        }
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (data.id) {
      fetchMessages();
    }
  }, [data.id]);

  // call api to get messages
  // if messages is empty, then define const of initialInput
  // then, call up useChat and define messages to be the messages retrieved or empty array. Also add initialInput if message is empty
  // in the JSX, pass the messages to chat-messages
  // the form to handle handlesubmit, the input to handle onchange and value
  // in the api/chat, onStart of streaming, insert the input to db, oncompletion, insert the response to db

  return (
    <div>
      <ResultCard data={data} />
      <ChatMessages key={data.id} searchResultId={data.id} />
    </div>
  );
};

export default ChatComponent;
