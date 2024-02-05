"use client";

import React from "react";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import FastLegalLogo from "../../../public/logo_rec.png";
import FastLegalLogoWhite from "../../../public/logo_white_rec.jpeg";
import { Menu, Home, Search, Settings } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import SubscriptionButton from "./subcription-button";
import { useState } from "react";
import { MobileSidebar } from "./mobile-sidebar";

const routes = [
  {
    icon: Home,
    href: "/dashboard",
    label: "Dashboard",
    pro: false,
  },
  {
    icon: Search,
    href: "/search",
    label: "Search",
    pro: true,
  },
  {
    icon: Settings,
    href: "/settings",
    label: "Settings",
    pro: false,
  },
];

const Navbar = ({ hasSubscription }: { hasSubscription: boolean }) => {
  const { theme } = useTheme();

  const logo = theme === "light" ? FastLegalLogoWhite : FastLegalLogo;

  return (
    <header className="flex items-center justify-between text-gray-200 text-2xl py-2 w-full border-b h-16 bg-black">
      <MobileSidebar />

      <Link href="/">
        <Image
          src={logo}
          alt="fastlegal-logo"
          width="170"
          height="50"
          className="ml-3 my-1"
        />
      </Link>

      <div className="mr-3 flex flex-row items-center gap-x-3">
        <SubscriptionButton hasSubscription={hasSubscription} />
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
};

export default Navbar;
