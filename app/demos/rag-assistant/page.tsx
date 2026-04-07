"use client";

import type { ChangeEvent } from "react";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { InputArea } from "@/components/rag-assistant/chat/InputArea";
import { MessageList } from "@/components/rag-assistant/chat/MessageList";
import { RightPanel } from "@/components/rag-assistant/layout/RightPanel";
import { Sidebar } from "@/components/rag-assistant/layout/Sidebar";
import { TopBar } from "@/components/rag-assistant/layout/TopBar";
import { useChat } from "@/hooks/rag-assistant/useChat";
import { useDocuments } from "@/hooks/rag-assistant/useDocuments";
import { useStats } from "@/hooks/rag-assistant/useStats";
import { useWebSocket } from "@/hooks/rag-assistant/useWebSocket";
import { uploadDocument } from "@/lib/rag-assistant/api";

export default function RagAssistantPage() {
  return (
    <Suspense fallback={<div className="app-shell" />}>
      <RagAssistantPageInner />
    </Suspense>
  );
}

function RagAssistantPageInner() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const { isConnected } = useWebSocket();
  const { messages, isStreaming, sendMessage } = useChat();
  const {
    documents,
    isLoading: areDocumentsLoading,
    error: documentsError,
    addPendingDocument,
  } = useDocuments();
  const { stats, isLoading: areStatsLoading, error: statsError } = useStats();

  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const adminParam = searchParams.get("admin");
  const adminToken = process.env.NEXT_PUBLIC_RAG_ASSISTANT_ADMIN_TOKEN;
  const isAdmin = Boolean(adminToken) && adminParam === adminToken;

  const embeddingModel =
    documents.find((document) => document.embeddingModel)?.embeddingModel ??
    "text-embedding-3-small";

  useEffect(() => {
    if (!selectedDocumentId && documents[0]) {
      setSelectedDocumentId(documents[0].id);
    }
  }, [documents, selectedDocumentId]);

  async function handleUpload(
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const response = await uploadDocument(file);
      addPendingDocument({
        id: response.documentId,
        name: file.name,
        status: "pending",
        chunkCount: 0,
        sizeBytes: file.size,
        createdAt: new Date().toISOString(),
        embeddingModel,
      });
      setSelectedDocumentId(response.documentId);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload document",
      );
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  const apiHealthy = !documentsError && !statsError && !uploadError;

  return (
    <div className="app-shell">
      <TopBar
        apiHealthy={apiHealthy}
        isWsConnected={isConnected}
        isUploading={isUploading}
        isAdmin={isAdmin}
        onUploadClick={() => fileInputRef.current?.click()}
      />

      <div className="main">
        <Sidebar
          documents={documents}
          isLoading={areDocumentsLoading}
          error={documentsError ?? uploadError}
          selectedDocumentId={selectedDocumentId}
          onSelectDocument={setSelectedDocumentId}
          isAdmin={isAdmin}
          onUploadClick={() => fileInputRef.current?.click()}
        />

        <div className="chat-area">
          <MessageList messages={messages} onRetry={sendMessage} onSend={sendMessage} />
          <InputArea onSend={sendMessage} isLoading={isStreaming} />
        </div>

        <RightPanel
          stats={stats}
          isLoading={areStatsLoading}
          error={statsError}
          modelName="claude-sonnet-4-5"
          embeddingModel={embeddingModel}
        />
      </div>

      <input
        ref={fileInputRef}
        className="sr-only"
        type="file"
        accept=".pdf,.xlsx,.txt,.docx"
        onChange={(event) => {
          void handleUpload(event);
        }}
      />
    </div>
  );
}
