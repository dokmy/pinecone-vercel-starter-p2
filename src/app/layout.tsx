import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export const metadata = {
  title: "FastLegal",
  description: "Supercharge your legal research",
};

import "../global.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider appearance={dark}>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
