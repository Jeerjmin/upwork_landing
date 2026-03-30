import {
  formatAgentTraceDocuments,
  formatAgentTraceLabel,
} from "@/lib/rag-assistant/trace";
import type { AgentTraceStep } from "@/lib/rag-assistant/types";

interface AgentTraceProps {
  trace: AgentTraceStep[];
}

export function AgentTrace({ trace }: AgentTraceProps) {
  if (trace.length === 0) {
    return null;
  }

  return (
    <div className="agent-trace" aria-label="Search trace">
      {trace.map((step) => {
        const docs = formatAgentTraceDocuments(step);

        return (
          <div key={step.iteration} className="agent-trace-row">
            <span className="agent-trace-label">
              {formatAgentTraceLabel(step)}
            </span>
            <span
              className={`badge ${
                step.status === "completed" ? "badge-green" : "badge-blue"
              }`}
            >
              {step.status}
            </span>
            {docs ? <span className="agent-trace-docs">{docs}</span> : null}
          </div>
        );
      })}
    </div>
  );
}
