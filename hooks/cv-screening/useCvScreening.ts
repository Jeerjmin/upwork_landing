"use client";

import type { Dispatch } from "react";
import { useEffect, useReducer, useState } from "react";

import { analyzeCv } from "@/lib/cv-screening/api";
import {
  getProgressTarget,
  getStatusLabel,
  shouldAutoStartAnalysis,
  stepProgressTowardsTarget,
} from "@/lib/cv-screening/progress";
import {
  createInitialCvScreeningState,
  cvScreeningReducer,
  getCvChecklistState,
} from "@/lib/cv-screening/state";
import type {
  CvScreeningAction,
  CvSelectedFile,
} from "@/lib/cv-screening/types";
import { useCvScreeningSocket } from "./useCvScreeningSocket";

const DEFAULT_JOB_DESCRIPTION = `We are looking for a Senior Backend Engineer to join our team. The ideal candidate has 5+ years of experience with Go or Node.js, deep knowledge of AWS (Lambda, API Gateway, RDS, S3), and hands-on experience building production event-driven systems.

Responsibilities:
— Design and implement scalable microservices
— Own reliability, monitoring, and alerting
— Work closely with the product team on AI integration

Requirements:
— 5+ years backend experience (Go preferred)
— AWS infrastructure experience
— Kafka or similar event streaming
— PostgreSQL / database design
— Experience with AI/LLM APIs is a strong plus

Salary: $130,000–160,000 · Remote · US timezone preferred`;

export function useCvScreening() {
  const [state, dispatch] = useReducer(cvScreeningReducer, {
    ...createInitialCvScreeningState(),
    jobDescription: DEFAULT_JOB_DESCRIPTION,
  });
  const [file, setFile] = useState<File | null>(null);
  const [pendingAutoStart, setPendingAutoStart] = useState(false);
  const [visualProgress, setVisualProgress] = useState(0);
  const { subscribe, subscribeStatus } = useCvScreeningSocket();

  useEffect(() => {
    return subscribeStatus(({ isConnected, connectionId }) => {
      dispatch({
        type: "socket_connection_changed",
        connected: isConnected,
      });

      if (connectionId) {
        dispatch({
          type: "connection_ready",
          connectionId,
        });
      }
    });
  }, [subscribeStatus]);

  useEffect(() => {
    return subscribe((message) => {
      switch (message.type) {
        case "connection_ready":
          dispatch({
            type: "connection_ready",
            connectionId: message.connectionId,
          });
          return;

        case "analysis_started":
          dispatch({
            type: "analysis_started_received",
            requestId: message.requestId,
          });
          return;

        case "analysis_progress":
          dispatch({
            type: "analysis_progress_received",
            requestId: message.requestId,
            message: message.message,
          });
          return;

        case "analysis_partial":
          dispatch({
            type: "analysis_partial_received",
            requestId: message.requestId,
            section: message.section,
            seq: message.seq,
            patch: message.patch,
          });
          return;

        case "analysis_completed":
          dispatch({
            type: "analysis_completed",
            requestId: message.requestId,
            data: message.data,
          });
          return;

        case "analysis_failed":
          dispatch({
            type: "analysis_failed",
            requestId: message.requestId,
            message: message.message,
          });
      }
    });
  }, [subscribe]);

  useEffect(() => {
    if (
      state.isSocketConnected ||
      (state.phase !== "submitting" && state.phase !== "processing")
    ) {
      return;
    }

    dispatch({
      type: "analysis_failed",
      requestId: state.requestId,
      message:
        "WebSocket connection lost while waiting for the analysis result.",
    });
  }, [state.isSocketConnected, state.phase, state.requestId]);

  useEffect(() => {
    if (
      !shouldAutoStartAnalysis({
        pendingAutoStart,
        hasFile: Boolean(file),
        hasJobDescription: Boolean(state.jobDescription.trim()),
        hasConnection: Boolean(state.connectionId),
        isAnalyzing:
          state.phase === "submitting" || state.phase === "processing",
      })
    ) {
      return;
    }

    if (!file || !state.connectionId) {
      return;
    }

    setPendingAutoStart(false);
    setVisualProgress(0);

    void runAnalysis({
      file,
      jobDescription: state.jobDescription,
      connectionId: state.connectionId,
      requestId: state.requestId,
      dispatch,
    });
  }, [
    pendingAutoStart,
    file,
    state.jobDescription,
    state.connectionId,
    state.phase,
    state.requestId,
  ]);

  useEffect(() => {
    if (state.result) {
      setVisualProgress(1);
      return;
    }

    if (
      state.phase === "input" &&
      !pendingAutoStart &&
      state.progressMessages.length === 0 &&
      !state.error
    ) {
      setVisualProgress(0);
      return;
    }

    const target = getProgressTarget(state);
    const timer = window.setInterval(() => {
      setVisualProgress((current) =>
        stepProgressTowardsTarget(current, target, Boolean(state.error)),
      );
    }, 120);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    pendingAutoStart,
    state.phase,
    state.progressMessages,
    state.error,
    state.result,
  ]);

  function updateJobDescription(value: string): void {
    dispatch({
      type: "job_description_changed",
      value,
    });
  }

  function selectFile(nextFile: File | null): void {
    if (!nextFile) {
      setFile(null);
      setPendingAutoStart(false);
      dispatch({ type: "file_cleared" });
      return;
    }

    if (!isPdfFile(nextFile)) {
      setFile(null);
      setPendingAutoStart(false);
      dispatch({ type: "file_cleared" });
      dispatch({
        type: "analysis_failed",
        requestId: null,
        message: "Only PDF uploads are supported.",
      });
      return;
    }

    setFile(nextFile);
    setPendingAutoStart(true);
    setVisualProgress(0);
    dispatch({
      type: "file_selected",
      file: toSelectedFile(nextFile),
    });
  }

  function resetWorkflow(): void {
    setFile(null);
    setPendingAutoStart(false);
    setVisualProgress(0);
    dispatch({ type: "workflow_reset" });
  }

  return {
    state,
    checklist: getCvChecklistState(state),
    pendingAutoStart,
    visualProgress,
    statusLabel: getStatusLabel({
      state,
      pendingAutoStart,
      hasConnection: Boolean(state.connectionId),
    }),
    updateJobDescription,
    selectFile,
    resetWorkflow,
  };
}

function toSelectedFile(file: File): CvSelectedFile {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
  };
}

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

async function runAnalysis(input: {
  file: File;
  jobDescription: string;
  connectionId: string;
  requestId: string | null;
  dispatch: Dispatch<CvScreeningAction>;
}): Promise<void> {
  input.dispatch({ type: "analysis_requested" });

  try {
    const response = await analyzeCv({
      file: input.file,
      jobDescription: input.jobDescription,
      connectionId: input.connectionId,
    });

    input.dispatch({
      type: "analysis_accepted",
      requestId: response.requestId,
      acceptedAt: response.acceptedAt,
    });
  } catch (error) {
    input.dispatch({
      type: "analysis_failed",
      requestId: input.requestId,
      message:
        error instanceof Error ? error.message : "Failed to analyze CV.",
    });
  }
}
