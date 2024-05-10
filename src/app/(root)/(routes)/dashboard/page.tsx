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
import { FolderSearch, Hammer, Bot, History } from "lucide-react";
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
  {
    icon: FolderSearch,
    href: "/search",
    label: "Multi-Case Search",
    description:
      "I have a client situation and I need to find similar cases and understand them in depth.",
    pro: true,
  },
  // {
  //   icon: Bot,
  //   href: "/ask",
  //   label: "FastAsk",
  //   description:
  //     "I have a legal question and I just need a quick answer with sources.",
  //   pro: true,
  // },
  {
    icon: History,
    href: "/history",
    label: "History",
    description:
      "Historical searches and results so you don't have to start from scratch.",
    pro: true,
  },
  {
    icon: Hammer,
    href: "/dashboard",
    label: "Coming soon...",
    description:
      "New features will be added to the dashboard. Stay tuned for updates.",
    pro: true,
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
    <Card className={cn("w-[380px]", className)} {...props}>
      <CardHeader>
        <CardTitle>{feature.label}</CardTitle>
        <CardDescription className="italic">
          {feature.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        <feature.icon className="h-1/3 w-1/3" />
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={() => onNavigate(feature.href)}>
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
