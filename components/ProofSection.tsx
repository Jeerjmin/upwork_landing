interface ProofMetric {
  label: string;
  value: string;
  valueClassName?: string;
}

interface ProofSectionProps {
  quoteBefore: string;
  quoteEmphasis: string;
  quoteAfter: string;
  sourceLabel: string;
  sourceText: string;
  metrics: ReadonlyArray<ProofMetric>;
  variant?: "default" | "embedded";
}

export function ProofSection({
  quoteBefore,
  quoteEmphasis,
  quoteAfter,
  sourceLabel,
  sourceText,
  metrics,
  variant = "default",
}: ProofSectionProps) {
  const quote = (
    <>
      &quot;{quoteBefore}
      <em>{quoteEmphasis}</em>
      {quoteAfter}&quot;
    </>
  );

  const metricsBlock = (
    <div className="proof-metrics">
      {metrics.map((metric) => (
        <div className="metric-row" key={metric.label}>
          <span className="metric-label">{metric.label}</span>
          <span className={`metric-val ${metric.valueClassName ?? ""}`.trim()}>
            {metric.value}
          </span>
        </div>
      ))}
    </div>
  );

  if (variant === "embedded") {
    return (
      <div className="proof-card proof-card--embedded">
        <p className="proof-quote">{quote}</p>
        <p className="proof-source">
          {sourceLabel} <span>{sourceText}</span>
        </p>
        {metricsBlock}
      </div>
    );
  }

  return (
    <div className="proof-section">
      <div className="proof-card">
        <div>
          <p className="proof-quote">{quote}</p>
          <p className="proof-source">
            {sourceLabel} <span>{sourceText}</span>
          </p>
        </div>
        {metricsBlock}
      </div>
    </div>
  );
}
