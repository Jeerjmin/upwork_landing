interface SourceChipProps {
  name: string;
  score?: number;
}

export function SourceChip({ name, score }: SourceChipProps) {
  return (
    <span className="source-chip">
      <span className="source-chip-dot" />
      {name}
      {typeof score === "number" ? (
        <span className="source-chip-score">{score.toFixed(2)}</span>
      ) : null}
    </span>
  );
}
