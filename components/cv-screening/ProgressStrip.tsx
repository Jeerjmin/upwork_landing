import type { CvChecklistState } from "@/lib/cv-screening/types";

interface ProgressStripProps {
  checklist: CvChecklistState;
  statusLabel: string;
  visualProgress: number;
  error: string | null;
}

export function ProgressStrip({
  checklist,
  statusLabel,
  visualProgress,
  error,
}: ProgressStripProps) {
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
            {statusLabel}
          </span>
        </div>

        <div className="cv-progress-block">
          <div className="cv-progress-meta">
            <span className="cv-progress-label">{statusLabel}</span>
          </div>
          <div className={`cv-progress-track ${error ? "is-error" : ""}`}>
            <div
              className={`cv-progress-fill ${checklist.isAnalyzing ? "is-active" : ""}`}
              style={{ width: `${Math.round(visualProgress * 100)}%` }}
            />
          </div>
        </div>

        {error ? <div className="cv-strip-note is-error">{error}</div> : null}
      </div>
    </div>
  );
}
