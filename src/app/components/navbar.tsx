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
          setMetadata(data);
        } catch (error) {
          console.error("Error fetching user metadata:", error);
        }
      }
    };

    fetchUserMetadata();
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
        {zeroMessageCredits && (
          <p className="text-sm text-gray-400">
            Message credits left is 0. Please upgrade or buy more.
          </p>
        )}
        {metadata?.registerFrom === "DX" && (
          <div className="flex flex-row gap-x-2">
            <a
              href="http://fastlegal.dataxquad.com/#FAQ"
              className="text-white px-4 py-2 rounded bg-[#C69048] text-sm"
            >
              See FAQs
            </a>
            <a
              href={`http://fastlegal.dataxquad.com/pricing?p=${user?.id}`}
              className="text-white px-4 py-2 rounded bg-[#C69048] text-sm"
            >
              Subscribe a Plan
            </a>
          </div>
        )}

        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
};

export default Navbar;

// "use client";

// import Image from "next/image";
// import { UserButton } from "@clerk/nextjs";
// import FastLegalLogo from "../../../public/logo_rec.png";
// import FastLegalLogoWhite from "../../../public/logo_white_rec.jpeg";
// import Link from "next/link";
// import { useTheme } from "next-themes";
// import { MobileSidebar } from "./mobile-sidebar";
// import { useUser } from "@clerk/nextjs";
// import { useEffect, useState } from "react";

// // Define the type for private metadata
// type PrivateMetadata = {
//   role: string;
//   customerID: string;
//   currentPlan: string;
//   canFreeTrial: boolean;
//   registerFrom: string;
// };

// const Navbar = ({ zeroMessageCredits }: { zeroMessageCredits: boolean }) => {
//   const { theme } = useTheme();
//   const logo = theme === "light" ? FastLegalLogoWhite : FastLegalLogo;
//   const { user } = useUser();
//   const [metadata, setMetadata] = useState<PrivateMetadata | null>(null);
//   const [subscriptionLink, setSubscriptionLink] = useState(
//     "http://localhost:3001/dashboard"
//   ); // Default link

//   useEffect(() => {
//     const fetchUserMetadata = async () => {
//       if (user) {
//         try {
//           const response = await fetch("/api/clerk/getMetadata", {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify({ userId: user.id }),
//           });

//           if (!response.ok) {
//             throw new Error("Failed to fetch user data");
//           }

//           const data = await response.json();
//           setMetadata(data);
//         } catch (error) {
//           console.error("Error fetching user metadata:", error);
//         }
//       }
//     };

//     fetchUserMetadata();
//   }, [user]);

//   useEffect(() => {
//     if (user) {
//       const fetchSubscriptionLink = async () => {
//         try {
//           const response = await fetch(
//             "https://x050mvneya.execute-api.us-east-2.amazonaws.com/prod/api/v1/payment/subscription-mgt-link",
//             {
//               method: "POST",
//               headers: {
//                 "Content-Type": "application/json",
//               },
//               body: JSON.stringify({ userID: user.id }),
//             }
//           );

//           if (!response.ok) {
//             throw new Error("Failed to fetch subscription link");
//           }

//           const result = await response.json();
//           if (result.data && result.data.link) {
//             setSubscriptionLink(result.data.link);
//           } else {
//             throw new Error("No link returned from the API");
//           }
//         } catch (error) {
//           console.error("Error fetching subscription link:", error);
//           setSubscriptionLink("#"); // Set to a fallback link or error state
//         }
//       };

//       fetchSubscriptionLink();
//     }
//   }, [user]);

//   return (
//     <header className="flex items-center justify-between text-gray-200 text-2xl py-2 w-full border-b h-16 bg-black">
//       <MobileSidebar />

//       <Link href="/">
//         <Image
//           src={logo}
//           alt="fastlegal-logo"
//           width="170"
//           height="50"
//           className="ml-3 my-1"
//         />
//       </Link>

//       <div className="mr-3 flex flex-row items-center gap-x-3">
//         {zeroMessageCredits && (
//           <p className="text-sm text-gray-400">
//             Message credits left is 0. Please upgrade or buy more.
//           </p>
//         )}
//         {metadata?.registerFrom === "DX" && (
//           <div className="flex flex-row gap-x-2">
//             <a
//               href="http://fastlegal.dataxquad.com/#FAQ"
//               className="text-white px-4 py-2 rounded bg-[#C69048] text-sm"
//             >
//               See FAQs
//             </a>
//             <a
//               href={subscriptionLink}
//               className="text-white px-4 py-2 rounded bg-[#C69048] text-sm"
//             >
//               Subscribe a Plan
//             </a>
//           </div>
//         )}

//         <UserButton afterSignOutUrl="/" />
//       </div>
//     </header>
//   );
// };

// export default Navbar;
