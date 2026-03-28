import { describe, expect, it } from "vitest";

import {
  createInitialCvScreeningState,
  cvScreeningReducer,
  getCvChecklistState,
  isCvReadyToAnalyze,
} from "./state";

const finalResult = {
  profile: {
    name: "Oleg Kostenko",
    currentRole: "AI Engineering Consultant",
    experience: {
      years: "7+",
      focus: "backend & AI systems",
    },
    keySkills: ["Go", "Node.js", "AWS"],
    education: "Computer Science",
  },
  fit: {
    overall: 82,
    summary: "Strong backend and AI systems fit.",
    breakdown: {
      technicalSkills: 92,
      experienceLevel: 88,
      aiLlmExposure: 95,
      domainFit: 75,
    },
  },
  flags: [{ severity: "positive", text: "Event-driven systems at scale." }],
};

describe("cvScreeningReducer", () => {
  it("moves to results when analysis completes", () => {
    const state = createInitialCvScreeningState();

    const withJobDescription = cvScreeningReducer(state, {
      type: "job_description_changed",
      value: "Senior Backend Engineer",
    });
    const withFile = cvScreeningReducer(withJobDescription, {
      type: "file_selected",
      file: {
        name: "candidate.pdf",
        size: 84000,
        type: "application/pdf",
      },
    });
    const withConnection = cvScreeningReducer(withFile, {
      type: "connection_ready",
      connectionId: "conn-1",
    });
    const inFlight = cvScreeningReducer(withConnection, {
      type: "analysis_requested",
    });
    const started = cvScreeningReducer(inFlight, {
      type: "analysis_started_received",
      requestId: "req-1",
    });
    const processing = cvScreeningReducer(started, {
      type: "analysis_progress_received",
      requestId: "req-1",
      message: "Running Claude analysis",
    });
    const completed = cvScreeningReducer(processing, {
      type: "analysis_completed",
      requestId: "req-1",
      data: finalResult,
    });

    expect(completed.phase).toBe("results");
    expect(completed.requestId).toBe("req-1");
    expect(completed.result?.fit.overall).toBe(82);
    expect(completed.partialResult?.fit?.overall).toBe(82);
    expect(completed.progressMessages).toContain("Running Claude analysis");
  });

  it("merges partial profile patches while staying in processing", () => {
    const partial = cvScreeningReducer(
      {
        ...createInitialCvScreeningState(),
        phase: "processing",
        requestId: "req-1",
      },
      {
        type: "analysis_partial_received",
        requestId: "req-1",
        section: "profile",
        seq: 1,
        patch: {
          profile: {
            name: "Jane Doe",
            experience: {
              years: "6+",
            },
          },
        },
      },
    );

    expect(partial.phase).toBe("processing");
    expect(partial.partialResult?.profile?.name).toBe("Jane Doe");
    expect(partial.partialResult?.profile?.experience?.years).toBe("6+");
    expect(partial.activeSection).toBe("profile");
    expect(partial.lastPartialSeq).toBe(1);
  });

  it("ignores stale partial sequence numbers", () => {
    const state = cvScreeningReducer(
      {
        ...createInitialCvScreeningState(),
        phase: "processing",
        requestId: "req-1",
        lastPartialSeq: 2,
        partialResult: {
          profile: {
            name: "Jane Doe",
          },
        },
      },
      {
        type: "analysis_partial_received",
        requestId: "req-1",
        section: "fit",
        seq: 2,
        patch: {
          fit: {
            overall: 80,
          },
        },
      },
    );

    expect(state.partialResult?.fit).toBeUndefined();
    expect(state.lastPartialSeq).toBe(2);
  });

  it("keeps partial content visible when analysis fails after partials", () => {
    const failed = cvScreeningReducer(
      {
        ...createInitialCvScreeningState(),
        phase: "processing",
        requestId: "req-1",
        partialResult: {
          profile: {
            name: "Jane Doe",
          },
        },
        lastPartialSeq: 1,
      },
      {
        type: "analysis_failed",
        requestId: "req-1",
        message: "Anthropic timeout",
      },
    );

    expect(failed.phase).toBe("processing");
    expect(failed.partialResult?.profile?.name).toBe("Jane Doe");
    expect(failed.error).toBe("Anthropic timeout");
  });

  it("exposes checklist state based on input readiness", () => {
    const state = cvScreeningReducer(createInitialCvScreeningState(), {
      type: "job_description_changed",
      value: "JD",
    });

    expect(getCvChecklistState(state)).toEqual({
      hasJobDescription: true,
      hasFile: false,
      hasConnection: false,
      isAnalyzing: false,
    });
    expect(isCvReadyToAnalyze(state)).toBe(false);
  });

  it("switches to processing when the websocket started event arrives", () => {
    const state = cvScreeningReducer(createInitialCvScreeningState(), {
      type: "analysis_requested",
    });

    const started = cvScreeningReducer(state, {
      type: "analysis_started_received",
      requestId: "req-started",
    });

    expect(started.phase).toBe("processing");
    expect(started.requestId).toBe("req-started");
  });

  it("keeps the results state when the HTTP accepted response arrives after completion", () => {
    const completed = cvScreeningReducer(createInitialCvScreeningState(), {
      type: "analysis_completed",
      requestId: "req-finished",
      data: finalResult,
    });

    const acceptedAfterCompletion = cvScreeningReducer(completed, {
      type: "analysis_accepted",
      requestId: "req-finished",
      acceptedAt: "2026-03-27T15:20:00.000Z",
    });

    expect(acceptedAfterCompletion.phase).toBe("results");
    expect(acceptedAfterCompletion.result?.fit.overall).toBe(82);
    expect(acceptedAfterCompletion.acceptedAt).toBe(
      "2026-03-27T15:20:00.000Z",
    );
  });

  it("merges nested experience fields across partial profile updates", () => {
    const stateWithYears = cvScreeningReducer(
      {
        ...createInitialCvScreeningState(),
        phase: "processing",
        requestId: "req-1",
      },
      {
        type: "analysis_partial_received",
        requestId: "req-1",
        section: "profile",
        seq: 1,
        patch: {
          profile: {
            experience: {
              years: "7+",
            },
          },
        },
      },
    );

    const merged = cvScreeningReducer(stateWithYears, {
      type: "analysis_partial_received",
      requestId: "req-1",
      section: "profile",
      seq: 2,
      patch: {
        profile: {
          experience: {
            focus: "backend & AI systems",
          },
        },
      },
    });

    expect(merged.partialResult?.profile?.experience).toEqual({
      years: "7+",
      focus: "backend & AI systems",
    });
  });

  it("clears the selected file when the workflow is reset", () => {
    const withFile = cvScreeningReducer(createInitialCvScreeningState(), {
      type: "file_selected",
      file: {
        name: "candidate.pdf",
        size: 84000,
        type: "application/pdf",
      },
    });

    const reset = cvScreeningReducer(withFile, {
      type: "workflow_reset",
    });

    expect(reset.selectedFile).toBeNull();
    expect(reset.partialResult).toBeNull();
    expect(reset.phase).toBe("input");
  });
});
