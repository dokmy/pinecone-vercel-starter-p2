export const metadata = {
  title: "FastLegal - Supercharge your Legal Research.",
  description: "AI-Powered & Chat-Based Seach Engine",
};

import "../global.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
