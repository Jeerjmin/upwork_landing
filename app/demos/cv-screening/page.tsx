"use client";

import type { ChangeEvent } from "react";
import { useRef } from "react";

import { CvNav } from "@/components/cv-screening/CvNav";
import { InputScreen } from "@/components/cv-screening/InputScreen";
import { ProgressStrip } from "@/components/cv-screening/ProgressStrip";
import { ResultsScreen } from "@/components/cv-screening/ResultsScreen";
import { useCvScreening } from "@/hooks/cv-screening/useCvScreening";

export default function CvScreeningPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    state,
    checklist,
    visualProgress,
    statusLabel,
    updateJobDescription,
    selectFile,
    resetWorkflow,
  } = useCvScreening();

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
        showBackButton={state.phase === "results"}
        onBack={resetWorkflow}
      />

      {state.phase === "results" && state.result ? (
        <ResultsScreen
          result={state.result}
          fileName={state.selectedFile?.name ?? "candidate.pdf"}
          jobDescription={state.jobDescription}
          acceptedAt={state.acceptedAt}
          onReset={resetWorkflow}
        />
      ) : (
        <>
          <InputScreen
            jobDescription={state.jobDescription}
            selectedFile={state.selectedFile}
            onJobDescriptionChange={updateJobDescription}
            onClearJobDescription={() => {
              updateJobDescription("");
            }}
            onUploadClick={() => fileInputRef.current?.click()}
          />

          <ProgressStrip
            checklist={checklist}
            statusLabel={statusLabel}
            visualProgress={visualProgress}
            error={state.error}
          />
        </>
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
