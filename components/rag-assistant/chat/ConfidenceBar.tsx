interface ConfidenceBarProps {
  value?: number;
}

export function ConfidenceBar({ value }: ConfidenceBarProps) {
  if (typeof value !== "number") {
    return null;
  }

  const clamped = Math.min(Math.max(value, 0), 1);
  const percent = `${Math.round(clamped * 100)}%`;
  const lowConfidence = clamped < 0.5;

  return (
    <div className="confidence">
      <span className="conf-label">confidence</span>
      <div className="conf-bar">
        <div
          className={`conf-fill ${lowConfidence ? "conf-fill-warning" : ""}`}
          style={{ width: percent }}
        />
      </div>
      <span className={`conf-val ${lowConfidence ? "conf-val-warning" : ""}`}>
        {clamped.toFixed(2)}
      </span>
    </div>
  );
}
