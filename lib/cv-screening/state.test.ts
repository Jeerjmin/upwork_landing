import { describe, expect, it } from "vitest";

import {
  createInitialCvScreeningState,
  cvScreeningReducer,
  getCvChecklistState,
  isCvReadyToAnalyze,
} from "./state";

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
      data: {
        profile: {
          name: "Oleg Kostenko",
          currentRole: "AI Engineering Consultant",
          experienceSummary: "7+ years backend, 1 year AI systems",
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
        questions: [
          {
            question: "How would you design an exactly-once Kafka consumer?",
            why: "Tests distributed-systems depth.",
          },
        ],
      },
    });

    expect(completed.phase).toBe("results");
    expect(completed.requestId).toBe("req-1");
    expect(completed.result?.fit.overall).toBe(82);
    expect(completed.progressMessages).toContain("Running Claude analysis");
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
});
