"use client";

interface Source {
  url: string;
  title: string;
  snippet: string;
}

interface SourcesProps {
  sources: Source[];
  onSourceClick?: (url: string) => void;
}

export default function Sources({ sources, onSourceClick }: SourcesProps) {
  if (!sources || sources.length === 0) return null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    e.preventDefault();
    onSourceClick?.(url);
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
        Sources
      </div>
      <div className="grid gap-2">
        {sources.map((source, index) => (
          <a
            key={index}
            href={source.url}
            onClick={(e) => handleClick(e, source.url)}
            className="block p-3 rounded-lg bg-[#2C2C2C] hover:bg-[#363636] transition-colors cursor-pointer"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-blue-400 hover:text-blue-300 truncate">
                  {source.title}
                </div>
                <div className="mt-1 text-xs text-gray-400 line-clamp-2">
                  {source.snippet}
                </div>
              </div>
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
