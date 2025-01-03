"use client";

import {
  Home,
  Search,
  Settings,
  Bot,
  History,
  FileText,
  BookOpen,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const onNavigate = (url: string, pro: boolean) => {
    return router.push(url);
  };

  const routes = [
    {
      icon: Home,
      href: "/dashboard",
      label: "Dashboard",
      pro: false,
      color: "text-gray-500",
    },
    // Litigation Tools
    {
      icon: Search,
      href: "/search",
      label: "Cases",
      pro: true,
      color: "text-violet-500",
    },
    {
      icon: History,
      href: "/history",
      label: "History",
      pro: false,
      color: "text-violet-400",
    },
    // IPO Tools
    {
      icon: FileText,
      href: "/search-hkex",
      label: "HKEX",
      pro: true,
      color: "text-blue-500",
    },
    {
      icon: BookOpen,
      href: "/listing-rules",
      label: "Rules",
      pro: true,
      color: "text-blue-400",
    },
    // Settings at the end
    {
      icon: Settings,
      href: "/settings",
      label: "Settings",
      pro: false,
      color: "text-gray-500",
    },
  ];

  return (
    <div className="space-y-4 flex flex-col h-full text-primary bg-transparent">
      <div className="p-3 flex-1 flex justify-center">
        <div className="space-y-2">
          {routes.map((route) => (
            <div
              onClick={() => onNavigate(route.href, route.pro)}
              key={route.href}
              className={cn(
                "text-muted-foreground text-xs group flex px-2 py-3 w-full justify-start font-medium cursor-pointer hover:text-primary hover:bg-primary/10 rounded-lg transition",
                pathname === route.href && "bg-primary/10 text-primary",
                route.color
              )}
            >
              <div className="flex flex-col gap-y-2 items-center flex-1">
                <route.icon className="h-5 w-5" />
                {route.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
