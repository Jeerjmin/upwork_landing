import type { Metadata } from "next";
import { JetBrains_Mono, Sora } from "next/font/google";

import "./demo.css";

const cvMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cv-mono",
  display: "swap",
});

const cvSans = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-cv-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CV Screening Demo",
  description:
    "Live CV screening demo with job-description matching, streaming analysis progress, and structured hiring insights.",
};

export default function CvScreeningLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${cvMono.variable} ${cvSans.variable} cv-font-scope`}>
      {children}
    </div>
  );
}
