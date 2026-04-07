"use client";

import type { ChangeEvent } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { CvNav } from "@/components/cv-screening/CvNav";
import { InputScreen } from "@/components/cv-screening/InputScreen";
import { LoadingScreen } from "@/components/cv-screening/LoadingScreen";
import { ResultsScreen } from "@/components/cv-screening/ResultsScreen";
import { useCvScreening } from "@/hooks/cv-screening/useCvScreening";
import type {
  CvPartialSection,
  CvScreeningPartialPatch,
  CvSelectedFile,
} from "@/lib/cv-screening/types";

const RESULTS_TRANSITION_MS = 820;

interface LoadingSnapshot {
  selectedFile: CvSelectedFile;
  jobDescription: string;
  visualProgress: number;
  statusLabel: string;
  partialResult: CvScreeningPartialPatch | null;
  activeSection: CvPartialSection | null;
  error: string | null;
}

export default function CvScreeningPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousPhaseRef = useRef<ReturnType<typeof useCvScreening>["state"]["phase"]>("input");
  const transitionTimerRef = useRef<number | null>(null);
  const lastLoadingSnapshotRef = useRef<LoadingSnapshot | null>(null);
  const [loadingTransitionSnapshot, setLoadingTransitionSnapshot] =
    useState<LoadingSnapshot | null>(null);
  const {
    state,
    pendingAutoStart,
    visualProgress,
    statusLabel,
    updateJobDescription,
    selectFile,
    resetWorkflow,
  } = useCvScreening();
  const isLoading =
    state.phase === "submitting" || state.phase === "processing";
  const isShowingResults = state.phase === "results" && Boolean(state.result);
  const shouldShowResultsTransition = Boolean(
    loadingTransitionSnapshot && isShowingResults && state.result,
  );

  if (isLoading && state.selectedFile) {
    lastLoadingSnapshotRef.current = {
      selectedFile: state.selectedFile,
      jobDescription: state.jobDescription,
      visualProgress,
      statusLabel,
      partialResult: state.partialResult,
      activeSection: state.activeSection,
      error: state.error,
    };
  }

  useLayoutEffect(() => {
    const wasLoading =
      previousPhaseRef.current === "submitting" ||
      previousPhaseRef.current === "processing";

    if (wasLoading && isShowingResults && state.result && lastLoadingSnapshotRef.current) {
      setLoadingTransitionSnapshot(lastLoadingSnapshotRef.current);

      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }

      transitionTimerRef.current = window.setTimeout(() => {
        setLoadingTransitionSnapshot(null);
        transitionTimerRef.current = null;
      }, RESULTS_TRANSITION_MS);
    }

    if (state.phase === "input" && transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
      setLoadingTransitionSnapshot(null);
    }

    previousPhaseRef.current = state.phase;
  }, [isShowingResults, state.phase, state.result]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    selectFile(event.target.files?.[0] ?? null);
    event.target.value = "";
  }

  return (
    <div className="cv-demo-shell">
      <CvNav
        isConnected={state.isSocketConnected}
        showBackButton={state.phase !== "input"}
        onBack={resetWorkflow}
      />

      {isShowingResults && state.result ? (
        <div className="cv-screen-transition">
          <div className="cv-screen-transition-results">
            <ResultsScreen
              result={state.result}
              fileName={state.selectedFile?.name ?? "candidate.pdf"}
              jobDescription={state.jobDescription}
              acceptedAt={state.acceptedAt}
              onReset={resetWorkflow}
              animateOnMount={!loadingTransitionSnapshot}
            />
          </div>

          {shouldShowResultsTransition && loadingTransitionSnapshot ? (
            <div className="cv-screen-transition-loading" aria-hidden="true">
              <LoadingScreen
                selectedFile={loadingTransitionSnapshot.selectedFile}
                jobDescription={loadingTransitionSnapshot.jobDescription}
                visualProgress={loadingTransitionSnapshot.visualProgress}
                statusLabel={loadingTransitionSnapshot.statusLabel}
                partialResult={loadingTransitionSnapshot.partialResult}
                activeSection={loadingTransitionSnapshot.activeSection}
                error={loadingTransitionSnapshot.error}
              />
            </div>
          ) : null}
        </div>
      ) : isLoading && state.selectedFile ? (
        <LoadingScreen
          selectedFile={state.selectedFile}
          jobDescription={state.jobDescription}
          visualProgress={visualProgress}
          statusLabel={statusLabel}
          partialResult={state.partialResult}
          activeSection={state.activeSection}
          error={state.error}
        />
      ) : (
        <InputScreen
          jobDescription={state.jobDescription}
          selectedFile={state.error ? null : state.selectedFile}
          error={state.error}
          fileStatusLabel={statusLabel}
          isAutoStarting={pendingAutoStart}
          onJobDescriptionChange={updateJobDescription}
          onClearJobDescription={() => {
            updateJobDescription("");
          }}
          onUploadClick={() => fileInputRef.current?.click()}
          onFileDrop={selectFile}
        />
      )}

      <input
        ref={fileInputRef}
        className="cv-sr-only"
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
      />
    </div>
  );
}
