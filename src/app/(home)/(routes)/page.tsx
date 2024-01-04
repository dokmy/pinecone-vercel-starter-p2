import Button from "@mui/material/Button";
import { UserButton, auth } from "@clerk/nextjs";
import { LogIn } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import FastLegalLogo from "public/logo_rec.png";

export default async function Home() {
  const { userId } = await auth();
  const isAuth = !!userId;

  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-gray-700 via-gray-900 to-black text-white">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center text-center">
          <Image
            src={FastLegalLogo}
            alt="fastlegal-logo"
            width="300"
            height="50"
            className="ml-3 mb-5"
          />
          <div className="flex items-center">
            <h1 className="mr-3 text-5xl mb-5 font-semibold">
              Supercharge Your Legal Research
            </h1>
            <UserButton afterSignOutUrl="/" />
          </div>

          <p className="max-w-xl mt-1 text-lg text-slate-600">
            Shift from merely sharing your sales decks and presentations to
            empowering them with AI that interacts and engages with your
            audience.
          </p>

          <div className="w-full mt-4">
            {isAuth ? (
              <Link href="/dashboard">
                <Button variant="outlined">Go to Dashboard </Button>
              </Link>
            ) : (
              <Link href="/sign-in">
                <Button variant="outlined">
                  Login to get started
                  <LogIn className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
