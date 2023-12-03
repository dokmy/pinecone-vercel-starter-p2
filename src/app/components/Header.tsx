import Image from "next/image";
import FastLegalLogo from "../../../public/logo_rec.png";
import Button from "@mui/material/Button";

export default function Header({ className }: { className?: string }) {
  return (
    <header
      className={`flex items-center justify-between text-gray-200 text-2xl ${className} py-2 w-full border-b`}
    >
      <Image
        src={FastLegalLogo}
        alt="fastlegal-logo"
        width="170"
        height="50"
        className="ml-3 my-1"
      />
      <div className="mr-3">
        <Button variant="outlined" color="primary">
          Login
        </Button>
      </div>
    </header>
  );
}
