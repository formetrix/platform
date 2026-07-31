import type { Metadata } from "next";
import { Geist_Mono, Inter, Space_Grotesk } from "next/font/google";

import { siteConfig } from "@/config/site";
import { Providers } from "@/components/providers/providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

import "./globals.css";

// Primary UI font (Formetrix brand system, FM-0026). Loaded as a variable
// font; components should stick to weights 500/600/700
// (font-medium/font-semibold/font-bold) per docs/DESIGN_SYSTEM.md §3.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Metric/data-emphasis font — used for stat numbers, percentages, and
// ticket IDs, distinct from prose (Inter) and code (Geist Mono).
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: next-themes sets the `class`/`style`
    // attribute on <html> before React hydrates; without this, React
    // would warn about a mismatch it did not cause.
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <Providers>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
