import type {
  ChatResponse,
  DocumentsResponse,
  IngestAcceptedResponse,
  StatsResponse,
} from "@/lib/rag-assistant/types";

const CHAT_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_CHAT_API_URL ?? process.env.NEXT_PUBLIC_API_URL,
);
const INGEST_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_INGEST_API_URL ?? CHAT_BASE_URL,
);

export async function sendChatMessage(params: {
  conversationId: string | null;
  message: string;
}): Promise<ChatResponse> {
  return request<ChatResponse>(`${CHAT_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question: params.message,
      conversationId: params.conversationId ?? undefined,
    }),
  });
}

export async function fetchDocuments(): Promise<DocumentsResponse> {
  return request<DocumentsResponse>(`${CHAT_BASE_URL}/documents`);
}

export async function fetchStats(): Promise<StatsResponse> {
  return request<StatsResponse>(`${CHAT_BASE_URL}/stats`);
}

export async function uploadDocument(
  file: File,
): Promise<IngestAcceptedResponse> {
  const arrayBuffer = await file.arrayBuffer();
  const contentBase64 = encodeBase64(arrayBuffer);

  return request<IngestAcceptedResponse>(`${INGEST_BASE_URL}/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      documentName: file.name,
      contentBase64,
      contentType: file.type || inferContentType(file.name),
      source: "webhook",
    }),
  });
}

async function request<T = void>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  if (!input.startsWith("http")) {
    throw new Error(
      "Set NEXT_PUBLIC_CHAT_API_URL and, if needed, NEXT_PUBLIC_INGEST_API_URL in .env.local",
    );
  }

  const response = await fetch(input, {
    ...init,
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await safeJson(response);
    throw new Error(
      typeof error?.error === "string"
        ? error.error
        : `Request failed with status ${response.status}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function normalizeBaseUrl(value: string | undefined): string {
  return (value ?? "").replace(/\/+$/, "");
}

async function safeJson(
  response: Response,
): Promise<{ error?: string } | null> {
  try {
    return (await response.json()) as { error?: string };
  } catch {
    return null;
  }
}

function encodeBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index] ?? 0);
  }

  return btoa(binary);
}

function inferContentType(fileName: string): string {
  const normalized = fileName.toLowerCase();

  if (normalized.endsWith(".pdf")) {
    return "application/pdf";
  }

  if (normalized.endsWith(".txt")) {
    return "text/plain";
  }

  if (normalized.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  if (normalized.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }

  return "application/octet-stream";
}
