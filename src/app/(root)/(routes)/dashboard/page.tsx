"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";
import { TypeAnimation } from "react-type-animation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FolderSearch,
  Hammer,
  Bot,
  History,
  BookOpen,
  MessageSquare,
  ScrollText,
  Settings,
  Search,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import DashboardOverlay from "@/components/disclaimer-overlay";

const ExampleComponent = () => {
  return (
    <TypeAnimation
      speed={40}
      sequence={[
        "How can I help you today?",
        () => {
          console.log("Sequence completed");
        },
      ]}
      wrapper="span"
      cursor={true}
      style={{ fontSize: "2em", display: "inline-block" }}
    />
  );
};

type CardProps = React.ComponentProps<typeof Card>;

const features = [
  // Litigation Lawyers Tools - Purple/Violet theme
  {
    icon: FolderSearch,
    href: "/search",
    label: "Multi-Case Search",
    description:
      "I have a client situation and I need to find similar cases and understand them in depth.",
    pro: true,
    category: "Litigation",
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-200/10",
  },
  {
    icon: History,
    href: "/history",
    label: "History",
    description:
      "Historical searches and results so you don't have to start from scratch.",
    pro: true,
    category: "Litigation",
    color: "text-violet-400",
    bgColor: "bg-violet-400/10",
    borderColor: "border-violet-200/10",
  },
  // IPO Lawyers Tools - Blue theme
  {
    icon: Search,
    href: "/search-hkex",
    label: "HKEX News Search",
    description:
      "Search through HKEX news and announcements to stay updated with the latest market information.",
    pro: true,
    category: "IPO",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-200/10",
  },
  {
    icon: BookOpen,
    href: "/listing-rules",
    label: "Listing Rules Assistant",
    description:
      "Ask questions about HKEX listing rules and get instant answers with source references.",
    pro: true,
    category: "IPO",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-200/10",
  },
];

const FeatureCard = ({
  feature,
  className,
  ...props
}: CardProps & { feature: (typeof features)[number] }) => {
  const router = useRouter();
  const pathname = usePathname();
  const onNavigate = (url: string) => {
    return router.push(url);
  };

  return (
    <Card
      className={cn("w-[380px]", feature.borderColor, className)}
      {...props}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{feature.label}</CardTitle>
          <span
            className={cn(
              "px-2 py-1 rounded-full text-xs font-semibold",
              feature.bgColor,
              feature.color,
              "border",
              feature.borderColor
            )}
          >
            {feature.category}
          </span>
        </div>
        <CardDescription className="italic">
          {feature.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        <feature.icon className={cn("h-1/3 w-1/3", feature.color)} />
      </CardContent>
      <CardFooter>
        <Button
          className={cn(
            "w-full",
            feature.bgColor,
            feature.color,
            "hover:opacity-80"
          )}
          onClick={() => onNavigate(feature.href)}
        >
          {feature.label}
        </Button>
      </CardFooter>
    </Card>
  );
};

const DashboardPage = () => {
  const { user } = useUser();

  return (
    <div className="flex flex-col flex-wrap gap-5 px-20 py-10 justify-center">
      <DashboardOverlay />
      <div>
        <h1 className="text-6xl bg-gradient-to-r from-sky-400 to-indigo-600 bg-clip-text text-transparent h-[70px]">
          Hi {user?.firstName}.
        </h1>
        <ExampleComponent />
      </div>
      <div className="flex flex-row flex-wrap gap-5  justify-center">
        {features.map((feature) => (
          <FeatureCard key={feature.href} feature={feature} />
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
