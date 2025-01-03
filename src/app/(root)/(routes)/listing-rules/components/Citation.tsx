"use client";

import { ExternalLink } from "lucide-react";

interface CitationProps {
  url: string;
  title: string;
  snippet: string;
}

export default function Citation({ url, title, snippet }: CitationProps) {
  return (
    <div className="mt-2 border border-gray-800 rounded-lg p-4 bg-[#1C1C1C]">
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-medium text-blue-400 hover:text-blue-300">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1"
          >
            {title}
            <ExternalLink className="h-3 w-3" />
          </a>
        </h3>
      </div>
      <p className="mt-1 text-sm text-gray-400">{snippet}</p>
    </div>
  );
}
