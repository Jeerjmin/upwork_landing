"use client";

import { useEffect, useState } from "react";

import { fetchDocuments } from "@/lib/rag-assistant/api";
import type { DocumentSummary } from "@/lib/rag-assistant/types";
import { useWebSocket } from "./useWebSocket";

export function useDocuments() {
  const { subscribe } = useWebSocket();
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetchDocuments();
        if (!cancelled) {
          setDocuments(response.documents);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load documents",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return subscribe((message) => {
      if (message.type === "doc_indexed") {
        setDocuments((current) => {
          const existingIndex = current.findIndex(
            (document) => document.id === message.document.id,
          );

          if (existingIndex === -1) {
            return [message.document, ...current];
          }

          return current.map((document) =>
            document.id === message.document.id ? message.document : document,
          );
        });
      }

      if (message.type === "doc_failed") {
        setDocuments((current) =>
          current.map((document) =>
            document.id === message.document.id
              ? {
                  ...document,
                  status: "failed",
                  error: message.document.error,
                }
              : document,
          ),
        );
      }
    });
  }, [subscribe]);

  function addPendingDocument(document: DocumentSummary): void {
    setDocuments((current) => [
      document,
      ...current.filter((item) => item.id !== document.id),
    ]);
  }

  return {
    documents,
    isLoading,
    error,
    addPendingDocument,
  };
}
