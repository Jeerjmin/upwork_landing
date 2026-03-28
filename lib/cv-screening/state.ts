import type {
  CvChecklistState,
  CvScreeningAction,
  CvScreeningPartialPatch,
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
    partialResult: null,
    activeSection: null,
    lastPartialSeq: 0,
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
        partialResult: null,
        activeSection: null,
        lastPartialSeq: 0,
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
        phase:
          state.phase === "submitting" || state.phase === "processing"
            ? "processing"
            : state.phase,
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

    case "analysis_partial_received":
      if (!matchesRequest(state.requestId, action.requestId)) {
        return state;
      }

      if (action.seq <= state.lastPartialSeq) {
        return state;
      }

      return {
        ...state,
        phase: "processing",
        requestId: action.requestId,
        partialResult: mergePartialResult(state.partialResult, action.patch),
        activeSection: action.section,
        lastPartialSeq: action.seq,
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
        partialResult: action.data,
        activeSection: null,
        error: null,
      };

    case "analysis_failed":
      if (!matchesRequest(state.requestId, action.requestId)) {
        return state;
      }

      return {
        ...state,
        phase: state.partialResult ? "processing" : "input",
        requestId: action.requestId ?? state.requestId,
        result: null,
        error: action.message,
      };

    case "workflow_reset":
      return {
        ...state,
        phase: "input",
        selectedFile: null,
        requestId: null,
        acceptedAt: null,
        progressMessages: [],
        result: null,
        partialResult: null,
        activeSection: null,
        lastPartialSeq: 0,
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

function mergePartialResult(
  current: CvScreeningPartialPatch | null,
  patch: CvScreeningPartialPatch,
): CvScreeningPartialPatch {
  const next: CvScreeningPartialPatch = {
    ...(current ?? {}),
  };

  if (patch.profile) {
    next.profile = {
      ...(current?.profile ?? {}),
      ...patch.profile,
      experience: {
        ...(current?.profile?.experience ?? {}),
        ...(patch.profile.experience ?? {}),
      },
    };

    if (!patch.profile.experience && current?.profile?.experience) {
      next.profile.experience = current.profile.experience;
    }

    if (
      next.profile.experience &&
      Object.keys(next.profile.experience).length === 0
    ) {
      delete next.profile.experience;
    }
  }

  if (patch.fit) {
    next.fit = {
      ...(current?.fit ?? {}),
      ...patch.fit,
      breakdown: {
        ...(current?.fit?.breakdown ?? {}),
        ...(patch.fit.breakdown ?? {}),
      },
    };

    if (!patch.fit.breakdown && current?.fit?.breakdown) {
      next.fit.breakdown = current.fit.breakdown;
    }

    if (next.fit.breakdown && Object.keys(next.fit.breakdown).length === 0) {
      delete next.fit.breakdown;
    }
  }

  if (patch.flags) {
    next.flags = patch.flags;
  }

  return next;
}
