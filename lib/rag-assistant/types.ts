export type DocumentStatus = "pending" | "processing" | "indexed" | "failed";
export type ChatRole = "user" | "assistant";

export interface ChatSourceDetail {
  name: string;
  score: number;
  chunkId?: string;
}

export interface ChatResponse {
  conversationId: string;
  answer: string;
  sources: string[];
  sourceDetails: ChatSourceDetail[];
  confidence: number;
  latencyMs: number;
}

export interface DocumentSummary {
  id: string;
  name: string;
  status: DocumentStatus;
  chunkCount: number;
  sizeBytes: number;
  createdAt: string;
  embeddingModel: string;
  error?: string;
}

export interface IngestAcceptedResponse {
  documentId: string;
  status: "queued";
}

export interface DocumentsResponse {
  documents: DocumentSummary[];
  total: number;
}

export interface StatsResponse {
  allTime: {
    queriesCount: number;
    avgLatencyMs: number;
    docsIndexed: number;
    errorsCount: number;
  };
  totals: {
    totalChunks: number;
    totalDocuments: number;
    totalSizeBytes: number;
  };
  vectorStore: {
    provider: "S3 Vectors";
    region: string;
    indexName: string;
  };
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  status?: "ready" | "loading" | "error";
  isStreaming?: boolean;
  isError?: boolean;
  retryText?: string;
  sources?: string[];
  sourceDetails?: ChatSourceDetail[];
  confidence?: number;
  latencyMs?: number;
}

export type WsServerMessage =
  | { type: "chunk"; text: string }
  | {
      type: "done";
      conversationId: string;
      sources: ChatSourceDetail[];
      confidence: number;
      hasSources: boolean;
      isLowConfidence: boolean;
      latencyMs: number;
    }
  | { type: "error"; message: string; partialText?: string }
  | { type: "doc_indexed"; document: DocumentSummary }
  | {
      type: "doc_failed";
      document: Pick<DocumentSummary, "id" | "name" | "status" | "error">;
    };
