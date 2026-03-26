interface TopBarProps {
  apiHealthy: boolean;
  isWsConnected: boolean;
  isUploading: boolean;
  onUploadClick(): void;
}

export function TopBar({
  apiHealthy,
  isWsConnected,
  isUploading,
  onUploadClick,
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="logo">
          <div className="logo-mark" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v2h-2v2H9z"
                fill="#000"
                opacity="0.8"
              />
              <path d="M11 11h2v2h-2z" fill="#000" opacity="0.4" />
            </svg>
          </div>
          <span className="logo-name">RAG Assistant</span>
        </div>
        <div className="logo-sep" />
        <div className="topbar-meta">
          <span className="workspace-name">live demo / internal knowledge</span>
          <div className="topbar-links">
            <a href="/" className="topbar-link">
              Back to landing
            </a>
          </div>
        </div>
      </div>

      <div className="topbar-right">
        <span
          className={`pulse ${
            isWsConnected ? "pulse-connected" : "pulse-reconnecting"
          }`}
        />
        <span className={`badge ${isWsConnected ? "badge-green" : "badge-amber"}`}>
          {isWsConnected ? "connected" : "reconnecting..."}
        </span>
        <span className={`badge ${apiHealthy ? "badge-green" : "badge-amber"}`}>
          {apiHealthy ? "API healthy" : "API degraded"}
        </span>
        <button
          className="btn-ghost topbar-upload"
          onClick={onUploadClick}
          type="button"
        >
          <UploadIcon />
          {isUploading ? "Uploading..." : "+ Upload"}
        </button>
      </div>
    </header>
  );
}

function UploadIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="13"
      height="13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 11.5V3.5M8 3.5L5.25 6.25M8 3.5L10.75 6.25M3.5 12.5H12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
