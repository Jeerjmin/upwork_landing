import type { CvChecklistState } from "@/lib/cv-screening/types";

interface ProgressStripProps {
  checklist: CvChecklistState;
  isDisabled: boolean;
  latestProgressMessage: string | null;
  error: string | null;
  onAnalyze: () => void;
}

export function ProgressStrip({
  checklist,
  isDisabled,
  latestProgressMessage,
  error,
  onAnalyze,
}: ProgressStripProps) {
  const analysisLabel = checklist.isAnalyzing
    ? latestProgressMessage ?? "Analysis in progress"
    : checklist.hasConnection
      ? "Analysis pending"
      : "WebSocket connecting";

  return (
    <div className="cv-strip">
      <div className="cv-strip-left">
        <div className="cv-checklist">
          <span
            className={`cv-check ${checklist.hasJobDescription ? "done" : "pending"}`}
          >
            Job description
          </span>
          <span className={`cv-check ${checklist.hasFile ? "done" : "pending"}`}>
            CV loaded
          </span>
          <span
            className={`cv-check ${
              checklist.hasConnection || checklist.isAnalyzing
                ? checklist.isAnalyzing
                  ? "active"
                  : "pending"
                : "pending"
            }`}
          >
            {analysisLabel}
          </span>
        </div>

        {error ? <div className="cv-strip-note is-error">{error}</div> : null}
      </div>

      <button
        className="cv-analyze-button"
        type="button"
        onClick={onAnalyze}
        disabled={isDisabled}
      >
        {checklist.isAnalyzing ? "Analyzing…" : "Analyze candidate"}
        <span className="cv-arrow">→</span>
      </button>
    </div>
  );
}
