import type { AgentTraceStep } from "./types";

export function formatAgentTraceLabel(step: AgentTraceStep): string {
  return `Searching ${step.iteration}: ${step.query}`;
}

export function formatAgentTraceDocuments(
  step: AgentTraceStep,
): string | null {
  if (!step.topDocuments || step.topDocuments.length === 0) {
    return null;
  }

  return step.topDocuments.slice(0, 2).join(" • ");
}
