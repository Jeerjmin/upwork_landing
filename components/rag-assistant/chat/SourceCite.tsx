interface SourceCiteProps {
  value: string;
}

export function SourceCite({ value }: SourceCiteProps) {
  return <span className="source-cite">[source: {value}]</span>;
}
