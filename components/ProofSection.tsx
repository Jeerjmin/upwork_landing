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
}

export function ProofSection({
  quoteBefore,
  quoteEmphasis,
  quoteAfter,
  sourceLabel,
  sourceText,
  metrics,
}: ProofSectionProps) {
  return (
    <div className="proof-section">
      <div className="proof-card">
        <div>
          <p className="proof-quote">
            &quot;{quoteBefore}
            <em>{quoteEmphasis}</em>
            {quoteAfter}&quot;
          </p>
          <p className="proof-source">
            {sourceLabel} <span>{sourceText}</span>
          </p>
        </div>
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
      </div>
    </div>
  );
}
