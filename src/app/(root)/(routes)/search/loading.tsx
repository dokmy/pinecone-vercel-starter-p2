// loading.tsx
import React from "react";
import Image from "next/image";
import FastLegalLogo from "public/logo_rec.png";

export default function Loading() {
  return (
    <div className="h-screen flex flex-col justify-center items-center">
      <div className="flex flex-col mt-5 animate-bounce justify-center items-center text-center">
        <Image
          src={FastLegalLogo}
          alt="fastlegal-logo"
          width="170"
          height="50"
          className="my-1"
        />
        Loading...
      </div>
    </div>
  );
}
