import Button from "@mui/material/Button";
import { UserButton, auth, currentUser } from "@clerk/nextjs";
import { LogIn } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import FastLegalLogo from "public/logo_rec.png";
import Navbar from "@/components/navbar";
import { MobileSidebar } from "@/components/mobile-sidebar";

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
  // try again
  return (
    <div className="min-h-min w-screen">
      <Navbar hasSubscription={false} isHomePage={true} />
      <div className="p-5 sm:p-10">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center">
            <h1 className="mb-5 leading-normal font-semibold text-6xl sm:text-8xl">
              Supercharge Your Legal Research
            </h1>
            {/* <UserButton afterSignOutUrl="/" /> */}
          </div>
          <p className="max-w-xl mt-1 text-base text-slate-600 sm:text-lg">
            Dive into a seamless research experience where AI understands the
            context of your legal inquiries, providing precise, relevant
            results. Discover the future of legal research with FastLegal.
          </p>
          <div className="w-full mt-8 mb-10">
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
          <div className="flex flex-col justify-center items-center w-full h-5/6 p-6 sm:w-4/5 my-10">
            <div className="card">
              <span className="glow"></span>
              <div className="inner z-20">
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
          {/* <div className="mx-auto mt-20 grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-28">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-8xl font-bold tracking-tighter sm:text-6xl slide-in-left">
                    Collaboration
                  </h3>
                  <p className="max-w-[600px] text-gray-500/1.25 md:text-xl/1.5 lg:text-base/1.5 xl:text-xl/1.25 dark:text-gray-400/1.25">
                    Make collaboration seamless with built-in code review tools.
                  </p>
                </div>
              </div>
            </div>
            <span className="w-full aspect-video object-cover object-center slide-in-left rounded-md bg-muted" />
          </div> */}
        </div>
      </div>
    </div>
  );
}
