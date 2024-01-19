"use client";
import React, { useState, useEffect } from "react";
import ChatComponent from "./chat-component";
import { toast } from "sonner";

interface SearchResult {
  id: string;
  caseName: string;
  caseNeutralCit: string;
  caseActionNo: string;
  caseDate: Date; // or string, if you are using ISO date strings
  caseUrl: string;
  createdAt: Date; // or string, for ISO date strings
  searchId: string;
  userId: string;
}

const ChatComponentsWrapper = ({
  searchResults,
  searchMetadataQuery,
}: {
  searchResults: SearchResult[];
  searchMetadataQuery: string;
}) => {
  const [activeChatId, setActiveChatId] = useState(null);

  const toggleIframe = (chatId: any) => {
    setActiveChatId(activeChatId === chatId ? null : chatId);
  };

  useEffect(() => {
    if (searchResults.length > 3) {
      toast("Swipe to the right for more results →", {
        action: {
          label: "Noted",
          onClick: () => console.log("Action!"),
        },
      });
    }
  }, [searchResults.length]);

  return (
    <div className="flex overflow-x-auto h-full w-full">
      {searchResults.map((result) => (
        <div
          key={result.id}
          className={`flex-none ${
            activeChatId === result.id ? "w-full" : "w-1/3"
          } border-r h-full ${
            activeChatId !== null && activeChatId !== result.id ? "hidden" : ""
          }`}
        >
          <ChatComponent
            key={result.id}
            data={result}
            query={searchMetadataQuery}
            isIframeShown={activeChatId === result.id}
            onToggleIframe={() => toggleIframe(result.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default ChatComponentsWrapper;
