import type { CvExperience } from "./types";

export function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function extractJobTitle(jobDescription: string): string {
  const lines = jobDescription
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const joined = lines.join(" ");
  const match =
    joined.match(
      /we are looking for an? (.+?)(?: to\b| who\b| with\b|\.|,|$)/i,
    ) ??
    joined.match(/position[:\s]+(.+?)(?:\.|,|$)/i) ??
    joined.match(/role[:\s]+(.+?)(?:\.|,|$)/i);

  if (match?.[1]) {
    return normalizeTitle(match[1]);
  }

  return lines[0] ?? "Role under review";
}

export function extractWorkModel(jobDescription: string): string {
  const normalized = jobDescription.toLowerCase();

  if (normalized.includes("remote")) {
    return "Remote";
  }

  if (normalized.includes("hybrid")) {
    return "Hybrid";
  }

  if (normalized.includes("onsite") || normalized.includes("on-site")) {
    return "On-site";
  }

  return "Flexible";
}

export function formatAcceptedAt(acceptedAt: string | null): string {
  if (!acceptedAt) {
    return "analyzed just now";
  }

  const diffMs = Date.now() - new Date(acceptedAt).getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes <= 1) {
    return "analyzed just now";
  }

  return `analyzed ${diffMinutes} min ago`;
}

export function getMatchLabel(score: number): string {
  if (score >= 80) {
    return "Strong match";
  }

  if (score >= 65) {
    return "Potential match";
  }

  return "Needs review";
}

export function formatExperienceLabel(
  experience: Partial<CvExperience> | null | undefined,
): string {
  const parts = [experience?.years, experience?.focus].filter(Boolean);
  return parts.join(" · ");
}

function normalizeTitle(value: string): string {
  return value.replace(/\s+/g, " ").trim().replace(/[.,]$/, "");
}
