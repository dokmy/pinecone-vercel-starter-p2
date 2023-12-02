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
import dayjs from "dayjs";

const Page: React.FC = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMinDate, setSelectedMinDate] = useState(dayjs("1991-07-11"));
  const [selectedMaxDate, setSelectedMaxDate] = useState(dayjs());
  const [cofa, setCofa] = useState<string[]>([]);
  const [coa, setCoa] = useState<string[]>([]);
  const [coficivil, setcoficivil] = useState<string[]>([]);
  const [coficriminal, setCoficriminal] = useState<string[]>([]);
  const [cofiprobate, setCofiprobate] = useState<string[]>([]);
  const [ct, setCt] = useState<string[]>([]);
  const [dc, setDc] = useState<string[]>([]);
  const [fc, setFc] = useState<string[]>([]);
  const [lt, setLt] = useState<string[]>([]);
  const [others, setOthers] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState("Relevance");

  console.log({
    searchQuery,
    selectedMinDate,
    selectedMaxDate,
    cofa,
    coa,
    coficivil,
    coficriminal,
    cofiprobate,
    ct,
    dc,
    fc,
    lt,
    others,
    sortOption,
  });

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
        <div className="w-1/3 p-2">
          <Search
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedMinDate={selectedMinDate}
            setSelectedMinDate={setSelectedMinDate}
            selectedMaxDate={selectedMaxDate}
            setSelectedMaxDate={setSelectedMaxDate}
            cofa={cofa}
            setCofa={setCofa}
            coa={coa}
            setCoa={setCoa}
            coficivil={coficivil}
            setcoficivil={setcoficivil}
            coficriminal={coficriminal}
            setCoficriminal={setCoficriminal}
            cofiprobate={cofiprobate}
            setCofiprobate={setCofiprobate}
            ct={ct}
            setCt={setCt}
            dc={dc}
            setDc={setDc}
            fc={fc}
            setFc={setFc}
            lt={lt}
            setLt={setLt}
            others={others}
            setOthers={setOthers}
            sortOption={sortOption}
            setSortOption={setSortOption}
          />
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
