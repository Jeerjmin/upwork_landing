"use client";

import { useEffect, useRef, useState } from "react";

import {
  CV_LOADING_STEPS,
  getCompletedLoadingStepCount,
} from "@/lib/cv-screening/progress";
import {
  extractJobTitle,
  formatExperienceLabel,
  formatFileSize,
  getMatchLabel,
} from "@/lib/cv-screening/presenter";
import type {
  CvFlagSeverity,
  CvPartialSection,
  CvScreeningPartialPatch,
  CvSelectedFile,
} from "@/lib/cv-screening/types";

interface LoadingScreenProps {
  selectedFile: CvSelectedFile;
  jobDescription: string;
  visualProgress: number;
  statusLabel: string;
  partialResult: CvScreeningPartialPatch | null;
  activeSection: CvPartialSection | null;
  error: string | null;
}

export function LoadingScreen({
  selectedFile,
  jobDescription,
  visualProgress,
  statusLabel,
  partialResult,
  activeSection,
  error,
}: LoadingScreenProps) {
  const completedStepCount = getCompletedLoadingStepCount(visualProgress);
  const [durations, setDurations] = useState<Array<string | null>>(
    Array.from({ length: CV_LOADING_STEPS.length }, () => null),
  );
  const durationsRef = useRef<Array<string | null>>(
    Array.from({ length: CV_LOADING_STEPS.length }, () => null),
  );
  const lastCompletedIndexRef = useRef(-1);
  const stepStartedAtRef = useRef(Date.now());

  useEffect(() => {
    const emptyDurations = Array.from(
      { length: CV_LOADING_STEPS.length },
      () => null,
    );
    durationsRef.current = emptyDurations;
    setDurations(emptyDurations);
    lastCompletedIndexRef.current = -1;
    stepStartedAtRef.current = Date.now();
  }, [jobDescription, selectedFile.name, selectedFile.size]);

  useEffect(() => {
    if (completedStepCount <= lastCompletedIndexRef.current + 1) {
      return;
    }

    const completedAt = Date.now();
    const next = [...durationsRef.current];

    for (
      let index = lastCompletedIndexRef.current + 1;
      index < completedStepCount;
      index += 1
    ) {
      next[index] = `${((completedAt - stepStartedAtRef.current) / 1000).toFixed(1)}s`;
      stepStartedAtRef.current = completedAt;
    }

    durationsRef.current = next;
    setDurations(next);
    lastCompletedIndexRef.current = completedStepCount - 1;
  }, [completedStepCount]);

  const activeStepIndex =
    completedStepCount >= CV_LOADING_STEPS.length ? null : completedStepCount;
  const progressPercent = Math.max(4, Math.round(visualProgress * 100));
  const jobTitle = extractJobTitle(jobDescription);
  const fileMeta =
    jobTitle === "Role under review" ? "Candidate under review" : jobTitle;
  const previewFlags = partialResult?.flags ?? [];
  const highlightFlags = previewFlags.filter(
    (flag) => flag.severity === "positive",
  );
  const concernFlags = previewFlags.filter(
    (flag) => flag.severity !== "positive",
  );
  const hasPreview = Boolean(
    partialResult?.profile ||
      partialResult?.fit ||
      (partialResult?.flags && partialResult.flags.length > 0),
  );

  return (
    <div className="cv-loading-screen">
      <div className="cv-loading-file">
        <div className="cv-loading-file-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>

        <div>
          <div className="cv-loading-file-name">{selectedFile.name}</div>
          <div className="cv-loading-file-meta">
            {fileMeta} · {formatFileSize(selectedFile.size)}
          </div>
        </div>
      </div>

      <div className="cv-loading-label">{statusLabel}</div>

      <div className="cv-progress-track" aria-hidden="true">
        <div
          className="cv-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="cv-steps-list" role="status" aria-live="polite">
        {CV_LOADING_STEPS.map((step, index) => {
          const state =
            index < completedStepCount
              ? "done"
              : index === activeStepIndex
                ? "running"
                : "waiting";

          return (
            <div className="cv-step-row" key={step.label}>
              <span className={`cv-step-status ${state}`}>
                {state === "done" ? "✓" : state === "running" ? "→" : "○"}
              </span>
              <span className={`cv-step-text ${state}`}>{step.label}</span>
              <span
                className={`cv-step-duration ${durations[index] ? "visible" : ""}`}
              >
                {durations[index] ?? ""}
              </span>
            </div>
          );
        })}
      </div>

      {error ? <div className="cv-loading-error">{error}</div> : null}

      {hasPreview ? (
        <div className="cv-loading-preview-grid">
          {partialResult?.profile ? (
            <section className={cardClassName(activeSection === "profile")}>
              <div className="cv-card-label">Candidate profile</div>
              <div className="cv-profile-grid">
                <PreviewRow label="Name" value={partialResult.profile.name} />
                <PreviewRow
                  label="Current role"
                  value={partialResult.profile.currentRole}
                />
                <PreviewRow
                  label="Experience"
                  value={formatExperienceLabel(partialResult.profile.experience)}
                  tone="teal"
                />
                <PreviewRow
                  label="Key skills"
                  value={partialResult.profile.keySkills?.join(", ")}
                />
                <PreviewRow
                  label="Education"
                  value={partialResult.profile.education}
                />
              </div>
            </section>
          ) : null}

          {partialResult?.fit ? (
            <section className={cardClassName(activeSection === "fit")}>
              <div className="cv-card-label">Fit snapshot</div>
              <div className="cv-loading-score-head">
                <div className="cv-loading-score-number">
                  {typeof partialResult.fit.overall === "number"
                    ? partialResult.fit.overall
                    : "--"}
                </div>
                <div className="cv-loading-score-copy">
                  <div className="cv-score-label">
                    {typeof partialResult.fit.overall === "number"
                      ? getMatchLabel(partialResult.fit.overall)
                      : "Fit in progress"}
                  </div>
                  <div className="cv-score-summary">
                    {partialResult.fit.summary ?? "Claude is still building the match summary."}
                  </div>
                </div>
              </div>

              {partialResult.fit.breakdown ? (
                <div className="cv-breakdown">
                  <PreviewBreakdownRow
                    label="Technical skills"
                    value={partialResult.fit.breakdown.technicalSkills}
                  />
                  <PreviewBreakdownRow
                    label="Experience level"
                    value={partialResult.fit.breakdown.experienceLevel}
                  />
                  <PreviewBreakdownRow
                    label="AI / LLM exposure"
                    value={partialResult.fit.breakdown.aiLlmExposure}
                  />
                  <PreviewBreakdownRow
                    label="Domain fit"
                    value={partialResult.fit.breakdown.domainFit}
                  />
                </div>
              ) : null}
            </section>
          ) : null}

          {partialResult?.flags?.length ? (
            <>
              <section className={cardClassName(activeSection === "flags")}>
                <div className="cv-card-label">Highlights</div>
                <PreviewFlagList
                  emptyMessage="Waiting for highlights..."
                  flags={highlightFlags}
                />
              </section>

              <section className={cardClassName(activeSection === "flags")}>
                <div className="cv-card-label">Flags</div>
                <PreviewFlagList
                  emptyMessage="Waiting for flags..."
                  flags={concernFlags}
                />
              </section>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PreviewRow(props: {
  label: string;
  value: string | undefined;
  tone?: "default" | "teal";
}) {
  if (!props.value) {
    return null;
  }

  return (
    <div className="cv-profile-row">
      <span className="cv-profile-key">{props.label}</span>
      <span
        className={`cv-profile-value ${props.tone === "teal" ? "is-teal" : ""}`}
      >
        {props.value}
      </span>
    </div>
  );
}

function PreviewBreakdownRow(props: {
  label: string;
  value: number | undefined;
}) {
  if (typeof props.value !== "number") {
    return null;
  }

  return (
    <div className="cv-breakdown-row">
      <span className="cv-breakdown-key">{props.label}</span>
      <div className="cv-breakdown-track">
        <div
          className="cv-breakdown-fill is-teal"
          style={{ width: `${props.value}%` }}
        />
      </div>
      <span className="cv-breakdown-value">{props.value}%</span>
    </div>
  );
}

function PreviewFlagList(props: {
  emptyMessage: string;
  flags: Array<{
    severity?: CvFlagSeverity;
    text?: string;
  }>;
}) {
  return (
    <div className="cv-flags">
      {props.flags.length ? (
        props.flags.map((flag, index) => (
          <div
            key={`${flag.severity ?? "unknown"}-${index}-${flag.text ?? ""}`}
            className={`cv-flag cv-flag-${toFlagTone(flag.severity)}`}
          >
            <span className="cv-flag-icon">
              {flag.severity === "positive"
                ? "✓"
                : flag.severity === "risk"
                  ? "×"
                  : "!"}
            </span>
            <span>{flag.text ?? "Signal in progress..."}</span>
          </div>
        ))
      ) : (
        <div className="cv-flag-empty">{props.emptyMessage}</div>
      )}
    </div>
  );
}

function cardClassName(isActive: boolean): string {
  return `cv-result-card cv-loading-preview-card ${isActive ? "is-active" : ""}`;
}

function toFlagTone(
  severity: "positive" | "warning" | "risk" | undefined,
): "teal" | "amber" | "red" {
  if (severity === "positive") {
    return "teal";
  }

  if (severity === "risk") {
    return "red";
  }

  return "amber";
}
