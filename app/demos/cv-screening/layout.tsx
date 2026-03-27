import type { Metadata } from "next";

import "./demo.css";

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
  return children;
}
