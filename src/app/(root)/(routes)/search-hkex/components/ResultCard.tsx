import { useState } from "react";
import t1codesData from "../data/t1codes.json";
import PDFViewer from "./PDFViewer";

interface ResultCardProps {
  result: any;
}

export default function ResultCard({ result }: ResultCardProps) {
  const [showPDF, setShowPDF] = useState(false);
  const document = result.document;
  const highlights = result.highlights;

  const getT1CodeName = (code: string) => {
    const t1code = t1codesData.codes.find((c) => c.code === code);
    return t1code ? t1code.name : code;
  };

  const handleViewPDF = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPDF(true);
  };

  const getPDFUrl = () => {
    const originalUrl = `https://www1.hkexnews.hk${document.FILE_LINK}`;
    return `/api/proxy-pdf?url=${encodeURIComponent(originalUrl)}`;
  };

  const getSearchQuery = () => {
    const highlight = highlights.find((h: any) => h.field === "chunk_text");
    if (highlight?.snippet) {
      const match = highlight.snippet.match(/<mark>(.*?)<\/mark>/);
      return match ? match[1] : "";
    }
    return "";
  };

  return (
    <div className="p-4 border rounded-lg mb-4 hover:shadow-lg transition-shadow">
      <h2 className="text-xl font-semibold mb-2">
        <span
          dangerouslySetInnerHTML={{
            __html:
              highlights.find((h: any) => h.field === "TITLE")?.snippet ||
              document.TITLE,
          }}
        />
      </h2>

      <div className="flex gap-2 text-sm text-gray-600 mb-2">
        <span>{document.STOCK_CODE}</span>
        <span>-</span>
        <span>{document.STOCK_NAME}</span>
        <span className="ml-auto">
          {new Date(document.unix_timestamp * 1000).toLocaleDateString()}
        </span>
      </div>

      <div className="inline-block text-sm bg-gray-50 text-gray-900 px-3 py-1 rounded mb-2">
        <span>{getT1CodeName(document.t1_code)}</span>
      </div>

      <div className="text-sm mb-4">
        <div
          dangerouslySetInnerHTML={{
            __html:
              highlights.find((h: any) => h.field === "chunk_text")?.snippet ||
              document.chunk_text,
          }}
        />
      </div>

      <button
        onClick={handleViewPDF}
        className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        View PDF
      </button>

      {showPDF && (
        <PDFViewer
          pdfUrl={getPDFUrl()}
          onClose={() => setShowPDF(false)}
          title={document.LONG_TEXT || document.TITLE}
          searchQuery={getSearchQuery()}
        />
      )}
    </div>
  );
}
