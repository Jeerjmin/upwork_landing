import type { CvSelectedFile } from "@/lib/cv-screening/types";

interface InputScreenProps {
  jobDescription: string;
  selectedFile: CvSelectedFile | null;
  onJobDescriptionChange: (value: string) => void;
  onClearJobDescription: () => void;
  onUploadClick: () => void;
}

export function InputScreen({
  jobDescription,
  selectedFile,
  onJobDescriptionChange,
  onClearJobDescription,
  onUploadClick,
}: InputScreenProps) {
  return (
    <>
      <div className="cv-hero">
        <div className="cv-hero-tag">Hiring AI · Powered by Claude</div>
        <div className="cv-hero-heading">
          Screen candidates in <em>seconds</em>,<br />
          not days
        </div>
        <div className="cv-hero-subtitle">
          Paste a job description, upload a CV — get structured profile, fit
          score, red flags, and tailored interview questions instantly. The
          same pipeline works for any PDF document type: invoices, contracts,
          applications.
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

          {selectedFile ? (
            <div className="cv-file-loaded">
              <div className="cv-file-header">
                <div className="cv-file-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>

                <div className="cv-file-info">
                  <div className="cv-file-name">{selectedFile.name}</div>
                  <div className="cv-file-meta">
                    PDF · {formatFileSize(selectedFile.size)} · uploaded
                  </div>
                </div>
              </div>

              <div className="cv-status-row">
                <div className="cv-status-ok">✓ CV ready</div>
              </div>
            </div>
          ) : (
            <div className="cv-upload-empty">
              <div className="cv-upload-copy">
                <div className="cv-upload-title">Upload candidate CV</div>
                <p className="cv-upload-text">
                  Use a PDF resume or application export. The analysis stays
                  stateless and streams back over the live WebSocket session.
                </p>
              </div>

              <button
                className="cv-upload-button"
                type="button"
                onClick={onUploadClick}
              >
                Choose PDF →
              </button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  return `${Math.round(size / 1024)} KB`;
}
