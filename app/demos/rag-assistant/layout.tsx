import type { Metadata } from "next";

import "./demo.css";

export const metadata: Metadata = {
  title: "RAG Assistant Demo",
  description:
    "Live internal knowledge assistant demo with document indexing, streaming responses, and source citations.",
};

export default function RagAssistantLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
