import type { CSSProperties } from "react";

import type { CvScreeningResult } from "@/lib/cv-screening/types";

interface ResultsScreenProps {
  result: CvScreeningResult;
  fileName: string;
  jobDescription: string;
  acceptedAt: string | null;
  onReset: () => void;
}

export function ResultsScreen({
  result,
  fileName,
  jobDescription,
  acceptedAt,
  onReset,
}: ResultsScreenProps) {
  const jobTitle = extractJobTitle(jobDescription);
  const workModel = extractWorkModel(jobDescription);
  const scoreStyle = {
    "--cv-score": `${result.fit.overall}`,
  } as CSSProperties;

  return (
    <>
      <div className="cv-result-header">
        <div className="cv-result-header-left">
          <div className="cv-result-meta">
            <span>{fileName}</span>
            <span className="cv-result-meta-separator">·</span>
            <span>{jobTitle}</span>
            <span className="cv-result-meta-separator">·</span>
            <span>{workModel}</span>
            <span className="cv-result-meta-separator">·</span>
            <span>{formatAcceptedAt(acceptedAt)}</span>
          </div>

          <div className="cv-result-candidate">{result.profile.name}</div>
          <div className="cv-result-position">
            {result.profile.currentRole} · {result.profile.experienceSummary}
          </div>
        </div>

        <div className="cv-score-hero">
          <div className="cv-score-circle" style={scoreStyle}>
            <span className="cv-score-number">{result.fit.overall}</span>
            <span className="cv-score-pct">/ 100</span>
          </div>

          <div className="cv-score-info">
            <div className="cv-score-label">
              {getMatchLabel(result.fit.overall)}
            </div>
            <div className="cv-score-summary">{result.fit.summary}</div>
          </div>
        </div>
      </div>

      <div className="cv-results-grid">
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
              value={result.profile.experienceSummary}
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
              tone={
                result.fit.breakdown.domainFit >= 80 ? "teal" : "amber"
              }
            />
          </div>
        </section>

        <section className="cv-result-card">
          <div className="cv-card-label">Flags &amp; highlights</div>
          <div className="cv-flags">
            {result.flags.map((flag) => (
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
            ))}
          </div>
        </section>

        <section className="cv-result-card">
          <div className="cv-card-label">Suggested interview questions</div>
          <div className="cv-questions">
            {result.questions.map((question, index) => (
              <div className="cv-question" key={question.question}>
                <div className="cv-question-number">
                  Q {String(index + 1).padStart(2, "0")}
                </div>
                <div className="cv-question-text">{question.question}</div>
                <div className="cv-question-why">{question.why}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="cv-results-footer">
        <div className="cv-results-note">
          <em>{"//"}</em> In production — the same analysis can run
          automatically
          when a CV arrives by email. Results can be posted to your ATS in
          seconds.
        </div>

        <button className="cv-results-button" type="button" onClick={onReset}>
          ← Analyze another →
        </button>
      </div>
    </>
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

function getMatchLabel(score: number): string {
  if (score >= 80) {
    return "Strong match";
  }

  if (score >= 65) {
    return "Potential match";
  }

  return "Needs review";
}

function extractJobTitle(jobDescription: string): string {
  return (
    jobDescription
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean) ?? "Role under review"
  );
}

function extractWorkModel(jobDescription: string): string {
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

function formatAcceptedAt(acceptedAt: string | null): string {
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
