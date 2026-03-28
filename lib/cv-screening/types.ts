export type CvFlagSeverity = "positive" | "warning" | "risk";
export type CvPartialSection = "profile" | "fit" | "flags";

export interface CvExperience {
  years: string;
  focus: string;
}

export interface CvScreeningProfile {
  name: string;
  currentRole: string;
  experience: CvExperience;
  keySkills: string[];
  education?: string;
}

export interface CvScreeningResult {
  profile: CvScreeningProfile;
  fit: {
    overall: number;
    summary: string;
    breakdown: {
      technicalSkills: number;
      experienceLevel: number;
      aiLlmExposure: number;
      domainFit: number;
    };
  };
  flags: Array<{
    severity: CvFlagSeverity;
    text: string;
  }>;
}

export interface CvScreeningPartialProfilePatch
  extends Partial<Omit<CvScreeningProfile, "experience">> {
  experience?: Partial<CvExperience>;
}

export interface CvScreeningPartialPatch {
  profile?: CvScreeningPartialProfilePatch;
  fit?: {
    overall?: number;
    summary?: string;
    breakdown?: Partial<CvScreeningResult["fit"]["breakdown"]>;
  };
  flags?: Array<{
    severity?: CvFlagSeverity;
    text?: string;
  }>;
}

export interface ConnectionReadyEvent {
  type: "connection_ready";
  connectionId: string;
}

export interface AnalysisStartedEvent {
  type: "analysis_started";
  requestId: string;
  stage: "accepted";
}

export interface AnalysisProgressEvent {
  type: "analysis_progress";
  requestId: string;
  stage: "processing";
  message: string;
}

export interface AnalysisPartialEvent {
  type: "analysis_partial";
  requestId: string;
  section: CvPartialSection;
  seq: number;
  patch: CvScreeningPartialPatch;
}

export interface AnalysisCompletedEvent {
  type: "analysis_completed";
  requestId: string;
  data: CvScreeningResult;
}

export interface AnalysisFailedEvent {
  type: "analysis_failed";
  requestId: string;
  message: string;
  retryable: boolean;
}

export type CvScreeningSocketEvent =
  | ConnectionReadyEvent
  | AnalysisStartedEvent
  | AnalysisProgressEvent
  | AnalysisPartialEvent
  | AnalysisCompletedEvent
  | AnalysisFailedEvent;

export interface AnalyzeAcceptedResponse {
  requestId: string;
  status: "processing";
  acceptedAt: string;
}

export interface CvSelectedFile {
  name: string;
  size: number;
  type: string;
}

export type CvScreeningPhase =
  | "input"
  | "submitting"
  | "processing"
  | "results";

export interface CvChecklistState {
  hasJobDescription: boolean;
  hasFile: boolean;
  hasConnection: boolean;
  isAnalyzing: boolean;
}

export interface CvScreeningState {
  phase: CvScreeningPhase;
  jobDescription: string;
  selectedFile: CvSelectedFile | null;
  isSocketConnected: boolean;
  connectionId: string | null;
  requestId: string | null;
  acceptedAt: string | null;
  progressMessages: string[];
  result: CvScreeningResult | null;
  partialResult: CvScreeningPartialPatch | null;
  activeSection: CvPartialSection | null;
  lastPartialSeq: number;
  error: string | null;
}

export type CvScreeningAction =
  | { type: "job_description_changed"; value: string }
  | { type: "file_selected"; file: CvSelectedFile }
  | { type: "file_cleared" }
  | { type: "socket_connection_changed"; connected: boolean }
  | { type: "connection_ready"; connectionId: string }
  | { type: "analysis_requested" }
  | {
      type: "analysis_started_received";
      requestId: string;
    }
  | {
      type: "analysis_accepted";
      requestId: string;
      acceptedAt: string;
    }
  | {
      type: "analysis_progress_received";
      requestId: string;
      message: string;
    }
  | {
      type: "analysis_partial_received";
      requestId: string;
      section: CvPartialSection;
      seq: number;
      patch: CvScreeningPartialPatch;
    }
  | {
      type: "analysis_completed";
      requestId: string;
      data: CvScreeningResult;
    }
  | {
      type: "analysis_failed";
      requestId: string | null;
      message: string;
    }
  | { type: "workflow_reset" };
