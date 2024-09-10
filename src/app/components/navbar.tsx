"use client";

import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import FastLegalLogo from "../../../public/logo_rec.png";
import FastLegalLogoWhite from "../../../public/logo_white_rec.jpeg";
import Link from "next/link";
import { useTheme } from "next-themes";
import { MobileSidebar } from "./mobile-sidebar";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

// Define the type for private metadata
type PrivateMetadata = {
  role: string;
  customerID: string;
  currentPlan: string;
  canFreeTrial: boolean;
  registerFrom: string;
};

const Navbar = ({ zeroMessageCredits }: { zeroMessageCredits: boolean }) => {
  const { theme } = useTheme();
  const logo = theme === "light" ? FastLegalLogoWhite : FastLegalLogo;
  const { user } = useUser();
  const [metadata, setMetadata] = useState<PrivateMetadata | null>(null);
  const [encryptedUserId, setEncryptedUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserMetadata = async () => {
      if (user) {
        try {
          const response = await fetch("/api/clerk/getMetadata", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId: user.id }),
          });

          if (!response.ok) {
            throw new Error("Failed to fetch user data");
          }

          const data = await response.json();
          console.log("METAdata = " + JSON.stringify(data));
          setMetadata(data);
        } catch (error) {
          console.error("Error fetching user metadata:", error);
        }
      }
    };

    const fetchEncryptedUserId = async (userId: string) => {
      try {
        const response = await fetch("/api/dx/encrypt-userid", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          throw new Error("Failed to encrypt user ID");
        }

        const data = await response.json();
        setEncryptedUserId(data.encryptedUserId);
      } catch (error) {
        console.error("Error encrypting user ID:", error);
      }
    };

    const fetchData = async () => {
      if (user) {
        await fetchUserMetadata();
        await fetchEncryptedUserId(user.id);
      }
    };

    fetchData();
  }, [user]);

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
        {zeroMessageCredits && metadata?.registerFrom === "DX" && (
          <>
            <p className="text-sm text-gray-400">
              Message credits left is 0. Please upgrade or buy more.
            </p>
            <div className="flex flex-row gap-x-2">
              <a
                href="http://www.dataxquad.com/legal/fastlegal#FAQ"
                className="text-white px-4 py-2 rounded bg-black border border-white text-sm"
              >
                See FAQs
              </a>
              <a
                href={`http://fastlegal.dataxquad.com/pricing?p=${encryptedUserId}`}
                className="text-white px-4 py-2 rounded bg-black border border-white text-sm"
              >
                Subscribe a Plan
              </a>
            </div>
          </>
        )}
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
};

export default Navbar;
