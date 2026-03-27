import type { AnalyzeAcceptedResponse } from "./types";

const CV_SCREENING_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_CV_SCREENING_API_URL,
);

export function buildCvScreeningFormData(params: {
  file: File;
  jobDescription: string;
  connectionId: string;
}): FormData {
  const formData = new FormData();

  formData.set("file", params.file, params.file.name);
  formData.set("job_description", params.jobDescription.trim());
  formData.set("connection_id", params.connectionId.trim());

  return formData;
}

export async function analyzeCv(params: {
  file: File;
  jobDescription: string;
  connectionId: string;
}): Promise<AnalyzeAcceptedResponse> {
  if (!CV_SCREENING_BASE_URL.startsWith("http")) {
    throw new Error(
      "Set NEXT_PUBLIC_CV_SCREENING_API_URL in .env.local",
    );
  }

  const response = await fetch(`${CV_SCREENING_BASE_URL}/analyze`, {
    method: "POST",
    body: buildCvScreeningFormData(params),
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

  return (await response.json()) as AnalyzeAcceptedResponse;
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
