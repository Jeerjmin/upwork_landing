"use client";

import type { ChangeEvent } from "react";
import { useRef } from "react";

import { CvNav } from "@/components/cv-screening/CvNav";
import { InputScreen } from "@/components/cv-screening/InputScreen";
import { LoadingScreen } from "@/components/cv-screening/LoadingScreen";
import { ResultsScreen } from "@/components/cv-screening/ResultsScreen";
import { useCvScreening } from "@/hooks/cv-screening/useCvScreening";

export default function CvScreeningPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        <ResultsScreen
          result={state.result}
          fileName={state.selectedFile?.name ?? "candidate.pdf"}
          jobDescription={state.jobDescription}
          acceptedAt={state.acceptedAt}
          onReset={resetWorkflow}
        />
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
