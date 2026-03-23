import type { Metadata } from "next";
import { DM_Mono, DM_Sans, Instrument_Serif } from "next/font/google";

import "./globals.css";

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Automation Engineer — Hire on Upwork",
  description:
    "I build production AI systems that automate document processing, answer your team's questions instantly, and qualify leads while you sleep.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmMono.variable} ${dmSans.variable} ${instrumentSerif.variable}`}
      style={
        {
          "--mono": "var(--font-dm-mono)",
          "--serif": "var(--font-instrument-serif)",
          "--sans": "var(--font-dm-sans)",
        } as React.CSSProperties
      }
    >
      <body>{children}</body>
    </html>
  );
}
