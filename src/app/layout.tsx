import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Vestige — Your style leaves a trace.",
  description:
    "An AI personal stylist that learns your evolving style over time. Every interaction leaves a trace.",
  keywords: ["AI stylist", "personal style", "outfit recommendations", "skin analysis"],
  openGraph: {
    title: "Vestige — Your style leaves a trace.",
    description: "An AI personal stylist that remembers.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /*
      Fonts are loaded via CSS @import in globals.css (browser-side fetch,
      not build-time). CSS variables --font-serif and --font-sans are set
      there so all component styles resolve correctly.
    */
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
