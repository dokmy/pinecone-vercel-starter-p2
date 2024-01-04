"use client";

import React from "react";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import FastLegalLogo from "../../../public/logo_rec.png";
import { Menu } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { ModeToggle } from "@/components/mode-toggle";

const Navbar = () => {
  return (
    <header className="flex items-center justify-between text-gray-200 text-2xl py-2 w-full border-b">
      <Menu className="block md:hidden" />
      <Link href="/">
        <Image
          src={FastLegalLogo}
          alt="fastlegal-logo"
          width="170"
          height="50"
          className="ml-3 my-1"
        />
      </Link>

      <div className="mr-3 flex flex-row items-center gap-x-3">
        <Button className="bg-red-600">Upgrade</Button>
        <ModeToggle />
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
};

export default Navbar;
