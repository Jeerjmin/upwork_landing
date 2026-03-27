"use client";

import { useEffect, useReducer, useState } from "react";

import { analyzeCv } from "@/lib/cv-screening/api";
import {
  createInitialCvScreeningState,
  cvScreeningReducer,
  getCvChecklistState,
  isCvReadyToAnalyze,
} from "@/lib/cv-screening/state";
import type { CvSelectedFile } from "@/lib/cv-screening/types";
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

  async function startAnalysis(): Promise<void> {
    if (!file) {
      dispatch({
        type: "analysis_failed",
        requestId: null,
        message: "Upload a PDF CV before starting the analysis.",
      });
      return;
    }

    if (!state.connectionId) {
      dispatch({
        type: "analysis_failed",
        requestId: null,
        message: "WebSocket connection is not ready yet. Please wait a moment.",
      });
      return;
    }

    if (!isCvReadyToAnalyze(state)) {
      return;
    }

    dispatch({ type: "analysis_requested" });

    try {
      const response = await analyzeCv({
        file,
        jobDescription: state.jobDescription,
        connectionId: state.connectionId,
      });

      dispatch({
        type: "analysis_accepted",
        requestId: response.requestId,
        acceptedAt: response.acceptedAt,
      });
    } catch (error) {
      dispatch({
        type: "analysis_failed",
        requestId: state.requestId,
        message:
          error instanceof Error
            ? error.message
            : "Failed to start CV screening",
      });
    }
  }

  function updateJobDescription(value: string): void {
    dispatch({
      type: "job_description_changed",
      value,
    });
  }

  function selectFile(nextFile: File | null): void {
    if (!nextFile) {
      setFile(null);
      dispatch({ type: "file_cleared" });
      return;
    }

    if (!isPdfFile(nextFile)) {
      setFile(null);
      dispatch({ type: "file_cleared" });
      dispatch({
        type: "analysis_failed",
        requestId: null,
        message: "Only PDF uploads are supported.",
      });
      return;
    }

    setFile(nextFile);
    dispatch({
      type: "file_selected",
      file: toSelectedFile(nextFile),
    });
  }

  function clearFile(): void {
    setFile(null);
    dispatch({ type: "file_cleared" });
  }

  function resetWorkflow(): void {
    dispatch({ type: "workflow_reset" });
  }

  return {
    state,
    checklist: getCvChecklistState(state),
    canAnalyze: isCvReadyToAnalyze(state),
    updateJobDescription,
    selectFile,
    clearFile,
    startAnalysis,
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
  return (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}
