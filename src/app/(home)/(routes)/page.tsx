"use client";
import Button from "@mui/material/Button";
import { useUser } from "@clerk/nextjs";
import { LogIn } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/navbar";
import { TypeAnimation } from "react-type-animation";

interface VideoPlayerProps {
  src: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

const ExampleComponent = () => {
  return (
    <TypeAnimation
      speed={90}
      deletionSpeed={90}
      sequence={[
        "Find cases where the plaintiff suffered vertebral fracture and let me know the PSLA figure",
        2000, // Waits 1s
        "My estate executor refused to transfer a property to me after the deceased died a year ago. Find me similar cases and let me know what are some grounds to transfer the property.",
        2000, // Waits 2s
        "What is the legal difference of having sexual intercourse with someone under 13, 16 and 18?",
        2000,
        "What are the procedures for divorce in Hong Kong?",
        2000,
        "If I receive writ today, when do I have to file acknowledgment of service?",
        2000,
        () => {
          console.log("Sequence completed");
        },
      ]}
      wrapper="span"
      cursor={true}
      repeat={Infinity}
      style={{
        fontSize: "1.5em",
        display: "inline-block",
        lineHeight: "1.5",
        fontFamily: "monospace",
      }}
      className="w-full sm:w-1/2"
    />
  );
};

export default function Home() {
  const { user } = useUser();

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
      <Navbar zeroMessageCredits={false} />
      <div className="p-5 sm:p-10">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center">
            <h1 className="mb-5 leading-normal font-semibold text-6xl sm:text-8xl ">
              <div className="leading-normal bg-gradient-to-r from-cyan-500 to-indigo-500 bg-clip-text text-transparent">
                Supercharge{" "}
              </div>
              Your Legal Research
            </h1>
            {/* <UserButton afterSignOutUrl="/" /> */}
          </div>
          <p className="max-w-xl mt-1 text-base text-slate-600 sm:text-lg mb-5">
            Dive into a seamless research experience where AI understands the
            context of your legal inquiries, providing precise, relevant
            results. Discover the future of legal research with FastLegal.
          </p>
          <ExampleComponent />
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
          <div className="flex flex-col justify-center items-center w-full h-5/6 p-6 sm:w-4/5 my-10 ">
            <div className="card w-full">
              <span className="glow"></span>
              <div className="inner z-10">
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
