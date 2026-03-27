import type { CvScreeningState } from "./types";

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

  if (latestMessage === "Extracting PDF text") {
    return 0.42;
  }

  if (latestMessage === "Running Claude analysis") {
    return 0.92;
  }

  if (state.phase === "processing") {
    return 0.3;
  }

  return 0;
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
