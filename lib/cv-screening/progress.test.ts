import { describe, expect, it } from "vitest";

import {
  getCompletedLoadingStepCount,
  getProgressTarget,
  getStatusLabel,
  shouldAutoStartAnalysis,
  stepProgressTowardsTarget,
} from "./progress";

describe("getProgressTarget", () => {
  it("maps submitting to the upload stage ceiling", () => {
    expect(
      getProgressTarget({
        phase: "submitting",
        progressMessages: [],
        error: null,
        result: null,
      }),
    ).toBeCloseTo(0.18);
  });

  it("maps extracting text to the parse stage ceiling", () => {
    expect(
      getProgressTarget({
        phase: "processing",
        progressMessages: ["Extracting PDF text"],
        error: null,
        result: null,
      }),
    ).toBeCloseTo(0.38);
  });

  it("maps section-specific Claude progress monotonically", () => {
    expect(
      getProgressTarget({
        phase: "processing",
        progressMessages: ["Running Claude analysis"],
        error: null,
        result: null,
      }),
    ).toBeCloseTo(0.5);

    expect(
      getProgressTarget({
        phase: "processing",
        progressMessages: ["Building candidate profile"],
        error: null,
        result: null,
      }),
    ).toBeGreaterThan(0.5);

    expect(
      getProgressTarget({
        phase: "processing",
        progressMessages: ["Finalizing result"],
        error: null,
        result: null,
      }),
    ).toBeGreaterThan(
      getProgressTarget({
        phase: "processing",
        progressMessages: ["Drafting strengths and risks"],
        error: null,
        result: null,
      }),
    );
  });

  it("completes immediately when a result exists", () => {
    expect(
      getProgressTarget({
        phase: "results",
        progressMessages: ["Finalizing result"],
        error: null,
        result: { fit: { overall: 82 } },
      } as never),
    ).toBe(1);
  });

  it("tracks how many loading checklist steps are complete", () => {
    expect(getCompletedLoadingStepCount(0.17)).toBe(0);
    expect(getCompletedLoadingStepCount(0.18)).toBe(1);
    expect(getCompletedLoadingStepCount(0.82)).toBe(4);
  });
});

describe("stepProgressTowardsTarget", () => {
  it("moves forward smoothly without overshooting", () => {
    expect(stepProgressTowardsTarget(0.4, 0.92)).toBeGreaterThan(0.4);
    expect(stepProgressTowardsTarget(0.91, 0.92)).toBeLessThanOrEqual(0.92);
  });

  it("freezes when the run is in error", () => {
    expect(stepProgressTowardsTarget(0.61, 0.92, true)).toBe(0.61);
  });
});

describe("shouldAutoStartAnalysis", () => {
  it("starts only when file, job description, connection, and pending intent exist", () => {
    expect(
      shouldAutoStartAnalysis({
        pendingAutoStart: true,
        hasFile: true,
        hasJobDescription: true,
        hasConnection: true,
        isAnalyzing: false,
      }),
    ).toBe(true);
  });

  it("does not auto-start on later job description edits alone", () => {
    expect(
      shouldAutoStartAnalysis({
        pendingAutoStart: false,
        hasFile: true,
        hasJobDescription: true,
        hasConnection: true,
        isAnalyzing: false,
      }),
    ).toBe(false);
  });
});

describe("getStatusLabel", () => {
  it("shows waiting state before any file is selected", () => {
    expect(
      getStatusLabel({
        state: {
          phase: "input",
          progressMessages: [],
          error: null,
          result: null,
          selectedFile: null,
        },
        pendingAutoStart: false,
        hasConnection: true,
      }),
    ).toBe("Waiting for PDF");
  });

  it("shows websocket wait status when a file is pending auto-start", () => {
    expect(
      getStatusLabel({
        state: {
          phase: "input",
          progressMessages: [],
          error: null,
          result: null,
          selectedFile: {
            name: "candidate.pdf",
            size: 1000,
            type: "application/pdf",
          },
        },
        pendingAutoStart: true,
        hasConnection: false,
      }),
    ).toBe("Waiting for WebSocket");
  });
});
