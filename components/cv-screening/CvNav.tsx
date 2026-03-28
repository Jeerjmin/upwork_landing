interface CvNavProps {
  isConnected: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function CvNav({
  isConnected,
  showBackButton = false,
  onBack,
}: CvNavProps) {
  return (
    <nav className="cv-nav">
      <div className="cv-nav-logo">
        cv<span>.</span>intelligence
      </div>

      <div className="cv-nav-right">
        {showBackButton ? (
          <button className="cv-nav-back" type="button" onClick={onBack}>
            ← new analysis
          </button>
        ) : null}

        <div
          className={`cv-nav-badge ${isConnected ? "is-live" : "is-reconnecting"}`}
        >
          <span className="cv-dot" />
          {isConnected ? "Claude API · Live" : "Claude API · Reconnecting"}
        </div>
      </div>
    </nav>
  );
}
