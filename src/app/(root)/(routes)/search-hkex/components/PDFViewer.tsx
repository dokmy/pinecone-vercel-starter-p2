"use client";

import {
  Worker,
  Viewer,
  TextBox,
  MinimalButton,
  Spinner,
  ScrollMode,
  ViewMode,
} from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import {
  searchPlugin,
  NextIcon,
  PreviousIcon,
  RenderSearchProps,
  Match,
} from "@react-pdf-viewer/search";
import * as pdfjsLib from "pdfjs-dist";
import { useState, useRef, useEffect } from "react";

// Import styles
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/search/lib/styles/index.css";

enum SearchStatus {
  NotSearchedYet,
  Searching,
  FoundResults,
}

interface PDFViewerProps {
  pdfUrl: string;
  onClose: () => void;
  title: string;
  searchQuery?: string;
}

export default function PDFViewer({
  pdfUrl,
  onClose,
  title,
  searchQuery,
}: PDFViewerProps) {
  const [searchStatus, setSearchStatus] = useState(SearchStatus.NotSearchedYet);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentSearchState, setCurrentSearchState] = useState<{
    keyword: string;
    currentMatch: number;
    numberOfMatches: number;
  }>({ keyword: "", currentMatch: 0, numberOfMatches: 0 });

  // Create a ref to store search instance
  const searchPluginInstance = useRef(
    searchPlugin({
      enableShortcuts: true,
      keyword: searchQuery,
      onHighlightKeyword: (props: { keyword: string | RegExp }) => {
        console.log("Highlight event:", props);
      },
    })
  ).current;

  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const { Search } = searchPluginInstance;

  // Move the useEffect to the main component
  useEffect(() => {
    console.log("Search state changed:", {
      keyword: currentSearchState.keyword,
      currentMatch: currentSearchState.currentMatch,
      numberOfMatches: currentSearchState.numberOfMatches,
    });
  }, [currentSearchState]);

  const renderSearchSidebar = (renderProps: RenderSearchProps) => {
    const {
      keyword,
      setKeyword,
      search,
      jumpToMatch,
      jumpToNextMatch,
      jumpToPreviousMatch,
      currentMatch,
      numberOfMatches,
    } = renderProps;

    // Update search state when it changes
    useEffect(() => {
      setCurrentSearchState({
        keyword,
        currentMatch,
        numberOfMatches,
      });
    }, [keyword, currentMatch, numberOfMatches]);

    const handleSearchKeyDown = async (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && keyword) {
        console.log("Starting search for:", keyword);
        setSearchStatus(SearchStatus.Searching);
        try {
          const searchMatches = await search();
          console.log("Search completed:", {
            matchesFound: searchMatches.length,
            currentMatch,
            numberOfMatches,
          });
          setMatches(searchMatches);
          setSearchStatus(SearchStatus.FoundResults);

          // Try to jump to first match after a short delay
          if (searchMatches.length > 0) {
            setTimeout(() => {
              console.log("Attempting to jump to first match");
              jumpToMatch(1);
            }, 100);
          }
        } catch (error) {
          console.error("Search error:", error);
        }
      }
    };

    const handleMatchClick = async (matchNumber: number) => {
      console.log("Match clicked:", {
        matchNumber,
        currentState: {
          currentMatch,
          numberOfMatches,
          matchesCount: matches.length,
        },
      });

      try {
        await jumpToMatch(matchNumber);
        console.log("Jump completed to match:", matchNumber);
      } catch (error) {
        console.error("Jump error:", error);
      }
    };

    return (
      <div className="flex flex-col h-full overflow-hidden bg-white">
        <div className="p-2">
          <div className="relative">
            <TextBox
              placeholder="Enter to search"
              value={keyword}
              onChange={(value: string) => {
                console.log("Search input changed:", value);
                setKeyword(value);
                if (!value) {
                  setSearchStatus(SearchStatus.NotSearchedYet);
                  setMatches([]);
                }
              }}
              onKeyDown={handleSearchKeyDown}
            />
            {searchStatus === SearchStatus.Searching && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Spinner size="1.5rem" />
              </div>
            )}
          </div>
        </div>

        {searchStatus === SearchStatus.FoundResults && (
          <>
            {matches.length === 0 ? (
              <div className="p-2 text-center text-gray-600">Not found</div>
            ) : (
              <>
                <div className="p-2 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {currentMatch || 0} of {matches.length} matches
                    </span>
                    <div className="flex gap-1">
                      <MinimalButton onClick={jumpToPreviousMatch}>
                        <PreviousIcon />
                      </MinimalButton>
                      <MinimalButton onClick={jumpToNextMatch}>
                        <NextIcon />
                      </MinimalButton>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-2">
                  {matches.map((match, index) => {
                    const matchNumber = index + 1;
                    return (
                      <div
                        key={`${match.pageIndex}-${index}`}
                        className={`p-2 mb-2 border rounded cursor-pointer text-gray-900 ${
                          currentMatch === matchNumber
                            ? "bg-gray-100 border-gray-400"
                            : "bg-white border-gray-200"
                        }`}
                        onClick={() => handleMatchClick(matchNumber)}
                      >
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>#{matchNumber}</span>
                          <span>Page {match.pageIndex + 1}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">
                            {match.pageText.substring(
                              Math.max(0, match.startIndex - 20),
                              match.startIndex
                            )}
                          </span>
                          <span className="bg-yellow-200 text-gray-900">
                            {match.pageText.substring(
                              match.startIndex,
                              match.endIndex
                            )}
                          </span>
                          <span className="text-gray-600">
                            {match.pageText.substring(
                              match.endIndex,
                              match.endIndex + 60
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900 truncate max-w-[90%]">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600 hover:text-gray-900"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="w-80 border-r bg-white overflow-hidden">
            <Search>{renderSearchSidebar}</Search>
          </div>
          <div className="flex-1">
            <Worker
              workerUrl={`https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`}
            >
              <div className="h-full">
                <Viewer
                  fileUrl={pdfUrl}
                  plugins={[searchPluginInstance, defaultLayoutPluginInstance]}
                  defaultScale={1}
                />
              </div>
            </Worker>
          </div>
        </div>
      </div>
    </div>
  );
}
