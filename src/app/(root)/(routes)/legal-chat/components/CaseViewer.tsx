"use client";

import { X, ExternalLink, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface CaseViewerProps {
  url: string;
  caseName: string;
  onClose: () => void;
}

export function CaseViewer({ url, caseName, onClose }: CaseViewerProps) {
  const [isFullWidth, setIsFullWidth] = useState(false);

  return (
    <div className={`h-full flex flex-col bg-gray-900 border-l border-gray-700 overflow-hidden ${isFullWidth ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header - fixed */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
        <div className="flex-1 min-w-0 mr-4">
          <h3 className="text-sm font-medium text-white truncate" title={caseName}>
            {caseName}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullWidth(!isFullWidth)}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
            title={isFullWidth ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullWidth ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(url, '_blank')}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* iframe - scrolls independently */}
      <div className="flex-1 min-h-0 bg-white overflow-hidden">
        <iframe
          src={url}
          className="w-full h-full border-0"
          title={caseName}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
    </div>
  );
}
