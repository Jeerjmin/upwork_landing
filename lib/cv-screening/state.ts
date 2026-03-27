import type {
  CvChecklistState,
  CvScreeningAction,
  CvScreeningState,
} from "./types";

export function createInitialCvScreeningState(): CvScreeningState {
  return {
    phase: "input",
    jobDescription: "",
    selectedFile: null,
    isSocketConnected: false,
    connectionId: null,
    requestId: null,
    acceptedAt: null,
    progressMessages: [],
    result: null,
    error: null,
  };
}

export function cvScreeningReducer(
  state: CvScreeningState,
  action: CvScreeningAction,
): CvScreeningState {
  switch (action.type) {
    case "job_description_changed":
      return {
        ...state,
        jobDescription: action.value,
        error: null,
      };

    case "file_selected":
      return {
        ...state,
        selectedFile: action.file,
        error: null,
      };

    case "file_cleared":
      return {
        ...state,
        selectedFile: null,
      };

    case "socket_connection_changed":
      return {
        ...state,
        isSocketConnected: action.connected,
        connectionId: action.connected ? state.connectionId : null,
      };

    case "connection_ready":
      return {
        ...state,
        isSocketConnected: true,
        connectionId: action.connectionId,
        error: null,
      };

    case "analysis_requested":
      return {
        ...state,
        phase: "submitting",
        requestId: null,
        acceptedAt: null,
        progressMessages: [],
        result: null,
        error: null,
      };

    case "analysis_started_received":
      return {
        ...state,
        phase: "processing",
        requestId: action.requestId,
        error: null,
      };

    case "analysis_accepted":
      return {
        ...state,
        phase: "processing",
        requestId: action.requestId,
        acceptedAt: action.acceptedAt,
      };

    case "analysis_progress_received":
      if (!matchesRequest(state.requestId, action.requestId)) {
        return state;
      }

      return {
        ...state,
        phase: "processing",
        requestId: action.requestId,
        progressMessages: appendProgressMessage(
          state.progressMessages,
          action.message,
        ),
        error: null,
      };

    case "analysis_completed":
      if (!matchesRequest(state.requestId, action.requestId)) {
        return state;
      }

      return {
        ...state,
        phase: "results",
        requestId: action.requestId,
        result: action.data,
        error: null,
      };

    case "analysis_failed":
      if (!matchesRequest(state.requestId, action.requestId)) {
        return state;
      }

      return {
        ...state,
        phase: "input",
        requestId: action.requestId ?? state.requestId,
        result: null,
        error: action.message,
      };

    case "workflow_reset":
      return {
        ...state,
        phase: "input",
        requestId: null,
        acceptedAt: null,
        progressMessages: [],
        result: null,
        error: null,
      };

    default:
      return state;
  }
}

export function getCvChecklistState(
  state: CvScreeningState,
): CvChecklistState {
  return {
    hasJobDescription: Boolean(state.jobDescription.trim()),
    hasFile: Boolean(state.selectedFile),
    hasConnection: Boolean(state.connectionId),
    isAnalyzing: state.phase === "submitting" || state.phase === "processing",
  };
}

export function isCvReadyToAnalyze(state: CvScreeningState): boolean {
  const checklist = getCvChecklistState(state);

  return (
    checklist.hasJobDescription &&
    checklist.hasFile &&
    checklist.hasConnection &&
    !checklist.isAnalyzing
  );
}

function matchesRequest(
  currentRequestId: string | null,
  incomingRequestId: string | null,
): boolean {
  return currentRequestId === null || currentRequestId === incomingRequestId;
}

function appendProgressMessage(
  progressMessages: string[],
  message: string,
): string[] {
  if (progressMessages[progressMessages.length - 1] === message) {
    return progressMessages;
  }

  return [...progressMessages, message];
}
