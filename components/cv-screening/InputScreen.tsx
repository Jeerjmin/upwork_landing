"use client";

import type { DragEvent } from "react";
import { useState } from "react";

import { formatFileSize } from "@/lib/cv-screening/presenter";
import type { CvSelectedFile } from "@/lib/cv-screening/types";

interface InputScreenProps {
  jobDescription: string;
  selectedFile: CvSelectedFile | null;
  error: string | null;
  fileStatusLabel: string;
  isAutoStarting: boolean;
  onJobDescriptionChange: (value: string) => void;
  onClearJobDescription: () => void;
  onUploadClick: () => void;
  onFileDrop: (file: File | null) => void;
}

export function InputScreen({
  jobDescription,
  selectedFile,
  error,
  fileStatusLabel,
  isAutoStarting,
  onJobDescriptionChange,
  onClearJobDescription,
  onUploadClick,
  onFileDrop,
}: InputScreenProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDragOver(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragOver(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragOver(false);
    onFileDrop(event.dataTransfer.files?.[0] ?? null);
  }

  return (
    <>
      <div className="cv-hero">
        <div className="cv-hero-tag">Hiring AI · Powered by Claude</div>
        <div className="cv-hero-heading">
          Screen candidates in <em>seconds</em>,<br />
          not days
        </div>
        <div className="cv-hero-subtitle">
          Paste a job description, upload a CV — analysis starts
          automatically. Get structured profile, fit score, and red flags in a
          compact screening report. The same pipeline works for any PDF:
          invoices, contracts, applications.
        </div>
      </div>

      <div className="cv-main">
        <section className="cv-panel cv-panel-left">
          <div className="cv-panel-label">
            <span className="cv-step">01</span>Job requirements
          </div>

          <div className="cv-editor">
            <div className="cv-editor-topbar">
              <span className="cv-editor-title">job_description.txt</span>
              <span className="cv-editor-hint">
                paste from LinkedIn, Upwork, or type
              </span>
            </div>

            <textarea
              className="cv-textarea"
              value={jobDescription}
              onChange={(event) => {
                onJobDescriptionChange(event.target.value);
              }}
            />

            <div className="cv-editor-footer">
              <span className="cv-counter">
                {jobDescription.length} characters
              </span>
              <button
                className="cv-clear-button"
                type="button"
                onClick={onClearJobDescription}
              >
                clear ×
              </button>
            </div>
          </div>
        </section>

        <section className="cv-panel">
          <div className="cv-panel-label">
            <span className="cv-step">02</span>Candidate CV
          </div>

          {selectedFile && !error ? (
            <div className="cv-file-card">
              <div className="cv-file-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>

              <div className="cv-file-info">
                <div className="cv-file-name">{selectedFile.name}</div>
                <div className="cv-file-meta">
                  PDF · {formatFileSize(selectedFile.size)} ·{" "}
                  {isAutoStarting ? "uploading..." : "uploaded"}
                </div>
              </div>

              <div className="cv-file-analyzing">
                {isAutoStarting ? <div className="cv-spin" aria-hidden="true" /> : null}
                {getUploadStatusText({
                  isAutoStarting,
                  fileStatusLabel,
                })}
              </div>
            </div>
          ) : (
            <div
              className={`cv-drop-zone ${isDragOver ? "drag-over" : ""}`}
              role="button"
              tabIndex={0}
              onClick={onUploadClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onUploadClick();
                }
              }}
            >
              <div className="cv-drop-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <polyline points="9 15 12 12 15 15" />
                </svg>
              </div>
              <div className="cv-drop-title">Drop CV here or click to upload</div>
              <div className="cv-drop-sub">Accepts PDF · Max 10 MB</div>
              <div className="cv-drop-auto-hint">
                → analysis starts automatically
              </div>
            </div>
          )}

          {error ? <div className="cv-input-note is-error">{error}</div> : null}
        </section>
      </div>
    </>
  );
}

function getUploadStatusText(input: {
  isAutoStarting: boolean;
  fileStatusLabel: string;
}): string {
  if (input.isAutoStarting) {
    if (input.fileStatusLabel === "Waiting for WebSocket") {
      return "waiting for websocket...";
    }

    return "analyzing...";
  }

  return "ready";
}
