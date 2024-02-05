import Button from "@mui/material/Button";
import { UserButton, auth, currentUser } from "@clerk/nextjs";
import { LogIn } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import FastLegalLogo from "public/logo_rec.png";

interface VideoPlayerProps {
  src: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

export default async function Home() {
  const { userId } = await auth();
  const isAuth = !!userId;

  console.log("is the user logged in", isAuth);
  console.log("here is the userId", userId);

  const user = await currentUser();
  console.log("currentUser is ", user);

  const VideoPlayer: React.FC<VideoPlayerProps> = ({
    src,
    controls,
    autoPlay,
    muted,
    loop,
  }) => (
    <video
      src={src}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
    />
  );

  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-gray-700 via-gray-900 to-black text-white">
      <div className="w-screen p-20">
        <div className="flex flex-col items-center text-center">
          <Image
            src={FastLegalLogo}
            alt="fastlegal-logo"
            width="300"
            height="50"
            className="ml-3 mb-5"
          />
          <div className="flex items-center">
            <h1 className="mr-3 text-3xl mb-5 font-semibold sm:text-5xl">
              Supercharge Your Legal Research
            </h1>
            <UserButton afterSignOutUrl="/" />
          </div>
          <p className="max-w-xl mt-1 text-md text-slate-600 sm:text-lg">
            Dive into a seamless research experience where AI understands the
            context of your legal inquiries, providing precise, relevant
            results. Discover the future of legal research with FastLegal.
          </p>
          <div className="w-full mt-4 mb-8">
            {user ? (
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
          <div className="w-full">
            <VideoPlayer
              src="/v2 - FastLegal demo video.mp4"
              controls
              autoPlay
              muted
              loop
            />
          </div>
        </div>
      </div>
    </div>
  );
}
