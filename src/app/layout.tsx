import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export const metadata = {
  title: "FastLegal",
  description: "Supercharge your legal research",
};

import "../global.css";
import { ThemeProvider } from "./components/theme-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang="en">
        <body>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
