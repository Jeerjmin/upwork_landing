"use client";

import { useEffect, useState } from "react";

import {
  extractJobTitle,
  extractWorkModel,
  formatAcceptedAt,
  formatExperienceLabel,
  getMatchLabel,
} from "@/lib/cv-screening/presenter";
import type { CvFlagSeverity, CvScreeningResult } from "@/lib/cv-screening/types";

interface ResultsScreenProps {
  result: CvScreeningResult;
  fileName: string;
  jobDescription: string;
  acceptedAt: string | null;
  onReset: () => void;
}

const SCORE_RING_RADIUS = 36;
const SCORE_RING_CIRCUMFERENCE = 2 * Math.PI * SCORE_RING_RADIUS;

export function ResultsScreen({
  result,
  fileName,
  jobDescription,
  acceptedAt,
  onReset,
}: ResultsScreenProps) {
  const jobTitle = extractJobTitle(jobDescription);
  const workModel = extractWorkModel(jobDescription);
  const score = Math.max(0, Math.min(100, result.fit.overall));
  const highlightFlags = result.flags.filter((flag) => flag.severity === "positive");
  const concernFlags = result.flags.filter((flag) => flag.severity !== "positive");
  const [scoreOffset, setScoreOffset] = useState(SCORE_RING_CIRCUMFERENCE);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setScoreOffset(SCORE_RING_CIRCUMFERENCE * (1 - score / 100));
    }, 200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [score]);

  return (
    <div className="cv-results-screen cv-fade-in">
      <div className="cv-result-header">
        <div className="cv-score-ring-wrap">
          <svg className="cv-score-ring" viewBox="0 0 84 84" aria-hidden="true">
            <circle className="cv-score-ring-bg" cx="42" cy="42" r="36" />
            <circle
              className="cv-score-ring-fg"
              cx="42"
              cy="42"
              r="36"
              style={{
                strokeDasharray: SCORE_RING_CIRCUMFERENCE,
                strokeDashoffset: scoreOffset,
              }}
            />
          </svg>
          <div className="cv-score-ring-text">
            <span className="cv-score-number">{score}</span>
            <span className="cv-score-pct">/ 100</span>
          </div>
        </div>

        <div className="cv-result-header-content">
          <div className="cv-result-meta">
            <span>{fileName}</span>
            <span className="cv-result-meta-separator">·</span>
            <span>{jobTitle}</span>
            <span className="cv-result-meta-separator">·</span>
            <span>{workModel}</span>
            <span className="cv-result-meta-separator">·</span>
            <span>{formatAcceptedAt(acceptedAt)}</span>
          </div>

          <div className="cv-result-overview">
            <div className="cv-result-identity">
              <div className="cv-result-candidate">{result.profile.name}</div>
              <div className="cv-result-position">
                {result.profile.currentRole} ·{" "}
                {formatExperienceLabel(result.profile.experience)}
              </div>
            </div>

            <div className="cv-score-info">
              <div className="cv-score-label">{getMatchLabel(score)}</div>
              <div className="cv-score-summary">{result.fit.summary}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="cv-results-body">
        <section className="cv-result-card">
          <div className="cv-card-label">Candidate profile</div>
          <div className="cv-profile-grid">
            <ProfileRow label="Name" value={result.profile.name} />
            <ProfileRow
              label="Current role"
              value={result.profile.currentRole}
            />
            <ProfileRow
              label="Experience"
              value={formatExperienceLabel(result.profile.experience)}
              tone="teal"
            />
            <ProfileRow
              label="Key skills"
              value={result.profile.keySkills.join(", ")}
            />
            <ProfileRow
              label="Education"
              value={result.profile.education ?? "Not specified"}
            />
          </div>
        </section>

        <section className="cv-result-card">
          <div className="cv-card-label">Fit breakdown</div>
          <div className="cv-breakdown">
            <BreakdownRow
              label="Technical skills"
              value={result.fit.breakdown.technicalSkills}
            />
            <BreakdownRow
              label="Experience level"
              value={result.fit.breakdown.experienceLevel}
            />
            <BreakdownRow
              label="AI / LLM exposure"
              value={result.fit.breakdown.aiLlmExposure}
            />
            <BreakdownRow
              label="Domain fit"
              value={result.fit.breakdown.domainFit}
              tone={result.fit.breakdown.domainFit >= 80 ? "teal" : "amber"}
            />
          </div>
        </section>

        <section className="cv-result-card">
          <div className="cv-card-label">Highlights</div>
          <FlagList
            emptyMessage="No standout strengths extracted."
            flags={highlightFlags}
          />
        </section>

        <section className="cv-result-card">
          <div className="cv-card-label">Flags</div>
          <FlagList
            emptyMessage="No material concerns surfaced."
            flags={concernFlags}
          />
        </section>
      </div>

      <div className="cv-results-footer">
        <div className="cv-results-note">
          <em>{"//"}</em> In production — same analysis runs automatically when
          CV arrives by email. Results posted to your ATS in seconds.
        </div>

        <button className="cv-results-button" type="button" onClick={onReset}>
          ← Analyze another
        </button>
      </div>
    </div>
  );
}

function ProfileRow(props: {
  label: string;
  value: string;
  tone?: "default" | "teal";
}) {
  return (
    <div className="cv-profile-row">
      <span className="cv-profile-key">{props.label}</span>
      <span
        className={`cv-profile-value ${
          props.tone === "teal" ? "is-teal" : ""
        }`}
      >
        {props.value}
      </span>
    </div>
  );
}

function BreakdownRow(props: {
  label: string;
  value: number;
  tone?: "teal" | "amber";
}) {
  const tone = props.tone ?? "teal";

  return (
    <div className="cv-breakdown-row">
      <span className="cv-breakdown-key">{props.label}</span>
      <div className="cv-breakdown-track">
        <div
          className={`cv-breakdown-fill is-${tone}`}
          style={{ width: `${props.value}%` }}
        />
      </div>
      <span className="cv-breakdown-value">{props.value}%</span>
    </div>
  );
}

function FlagList(props: {
  emptyMessage: string;
  flags: Array<{
    severity: CvFlagSeverity;
    text: string;
  }>;
}) {
  return (
    <div className="cv-flags">
      {props.flags.length ? (
        props.flags.map((flag) => (
          <div
            key={`${flag.severity}-${flag.text}`}
            className={`cv-flag cv-flag-${toFlagTone(flag.severity)}`}
          >
            <span className="cv-flag-icon">
              {flag.severity === "positive"
                ? "✓"
                : flag.severity === "risk"
                  ? "×"
                  : "!"}
            </span>
            <span>{flag.text}</span>
          </div>
        ))
      ) : (
        <div className="cv-flag-empty">{props.emptyMessage}</div>
      )}
    </div>
  );
}

function toFlagTone(
  severity: "positive" | "warning" | "risk",
): "teal" | "amber" | "red" {
  if (severity === "positive") {
    return "teal";
  }

  if (severity === "risk") {
    return "red";
  }

  return "amber";
}
