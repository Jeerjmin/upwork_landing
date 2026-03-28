import type { CvScreeningState } from "./types";

export const CV_LOADING_STEPS = [
  { label: "Parsing PDF document", progress: 0.18 },
  { label: "Building candidate profile", progress: 0.38 },
  { label: "Scoring role fit", progress: 0.62 },
  { label: "Drafting strengths and risks", progress: 0.82 },
] as const;

export function getProgressTarget(
  state: Pick<
    CvScreeningState,
    "phase" | "progressMessages" | "error" | "result"
  >,
): number {
  if (state.result) {
    return 1;
  }

  if (state.phase === "submitting") {
    return 0.18;
  }

  const latestMessage =
    state.progressMessages[state.progressMessages.length - 1] ?? "";

  switch (latestMessage) {
    case "Extracting PDF text":
      return 0.38;
    case "Running Claude analysis":
      return 0.5;
    case "Building candidate profile":
      return 0.62;
    case "Scoring role fit":
      return 0.76;
    case "Drafting strengths and risks":
      return 0.88;
    case "Finalizing result":
      return 0.99;
    default:
      return state.phase === "processing" ? 0.24 : 0;
  }
}

export function stepProgressTowardsTarget(
  current: number,
  target: number,
  freeze = false,
): number {
  if (freeze || target <= current) {
    return current;
  }

  const delta = Math.max((target - current) * 0.12, 0.01);
  return Math.min(target, current + delta);
}

export function shouldAutoStartAnalysis(input: {
  pendingAutoStart: boolean;
  hasFile: boolean;
  hasJobDescription: boolean;
  hasConnection: boolean;
  isAnalyzing: boolean;
}): boolean {
  return (
    input.pendingAutoStart &&
    input.hasFile &&
    input.hasJobDescription &&
    input.hasConnection &&
    !input.isAnalyzing
  );
}

export function getStatusLabel(input: {
  state: Pick<
    CvScreeningState,
    "phase" | "progressMessages" | "error" | "result" | "selectedFile"
  >;
  pendingAutoStart: boolean;
  hasConnection: boolean;
}): string {
  if (input.state.error) {
    return "Analysis failed";
  }

  if (input.state.result) {
    return "Analysis complete";
  }

  if (input.state.phase === "submitting") {
    return "Uploading request";
  }

  const latestMessage =
    input.state.progressMessages[input.state.progressMessages.length - 1];
  if (latestMessage) {
    return latestMessage;
  }

  if (input.pendingAutoStart && !input.hasConnection) {
    return "Waiting for WebSocket";
  }

  if (input.pendingAutoStart) {
    return "Starting analysis";
  }

  if (input.state.selectedFile) {
    return "CV ready";
  }

  return "Waiting for PDF";
}

export function getCompletedLoadingStepCount(progress: number): number {
  return CV_LOADING_STEPS.filter((step) => progress >= step.progress).length;
}
