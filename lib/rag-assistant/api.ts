import type {
  ChatResponse,
  DocumentsResponse,
  IngestAcceptedResponse,
  InitiateUploadResponse,
  StatsResponse,
  UploadPart,
} from "@/lib/rag-assistant/types";

const MAX_CONCURRENT_UPLOADS = 4;

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
  const contentType = file.type || inferContentType(file.name);
  const upload = await request<InitiateUploadResponse>(
    `${INGEST_BASE_URL}/ingest/uploads/initiate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documentName: file.name,
        sizeBytes: file.size,
        contentType,
        source: "webhook",
      }),
    },
  );

  await uploadDocumentParts(file, upload.parts, upload.partSizeBytes);

  return request<IngestAcceptedResponse>(`${INGEST_BASE_URL}/ingest/uploads/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      uploadId: upload.uploadId,
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

async function uploadDocumentParts(
  file: File,
  parts: UploadPart[],
  partSizeBytes: number,
): Promise<void> {
  if (partSizeBytes <= 0) {
    throw new Error("Upload part size must be greater than zero");
  }

  const orderedParts = [...parts].sort(
    (left, right) => left.partNumber - right.partNumber,
  );

  for (let index = 0; index < orderedParts.length; index += MAX_CONCURRENT_UPLOADS) {
    const batch = orderedParts.slice(index, index + MAX_CONCURRENT_UPLOADS);
    await Promise.all(
      batch.map((part) => uploadPart(file, part, partSizeBytes)),
    );
  }
}

async function uploadPart(
  file: File,
  part: UploadPart,
  partSizeBytes: number,
): Promise<void> {
  const start = (part.partNumber - 1) * partSizeBytes;
  const end = Math.min(start + partSizeBytes, file.size);
  const response = await fetch(part.url, {
    method: "PUT",
    body: file.slice(start, end),
  });

  if (!response.ok) {
    throw new Error(`Failed to upload document part ${part.partNumber}`);
  }
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
