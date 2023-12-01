// page.tsx

"use client";

import React, { useEffect, useRef, useState, FormEvent } from "react";
import { Context } from "@/components/Context";
import Header from "@/components/Header";
import Chat from "@/components/Chat";
import { useChat } from "ai/react";
import InstructionModal from "./components/InstructionModal";
import { AiFillGithub, AiOutlineInfoCircle } from "react-icons/ai";
import Search from "./components/Search";

const Page: React.FC = () => {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col justify-between h-screen bg-gray-800 p-2 mx-auto max-w-full">
      <Header className="my-5" />
      <button
        onClick={() => setModalOpen(true)}
        className="fixed right-4 top-4 md:right-6 md:top-6 text-xl text-white animate-pulse-once info-button"
      >
        <AiOutlineInfoCircle />
      </button>

      <InstructionModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
      />
      <div className="flex w-full flex-grow overflow-hidden relative">
        <div className="w-1/5 p-2">
          <Search />
        </div>
        <div className="w-2/5 p-2">
          <Chat raw_case_num="2023_HKCFI_2489" />
        </div>
        <div className="w-2/5 p-2">
          <Chat raw_case_num="2023_HKCFI_2489" />
        </div>
        <div className="w-2/5 p-2">
          <Chat raw_case_num="2023_HKCFI_2489" />
        </div>
      </div>
    </div>
  );
};

export default Page;
