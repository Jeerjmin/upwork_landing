import type { StatsResponse } from "@/lib/rag-assistant/types";

interface RightPanelProps {
  stats: StatsResponse | null;
  isLoading: boolean;
  error: string | null;
  modelName: string;
  embeddingModel: string;
}

export function RightPanel({
  stats,
  isLoading,
  error,
  modelName,
  embeddingModel,
}: RightPanelProps) {
  return (
    <aside className="right-panel">
      <div className="rp-section">
        <div className="rp-label">Stack</div>
        <TechItem label="LLM" value={modelName} />
        <TechItem label="Embeddings" value={embeddingModel} />
      </div>

      <div className="rp-section">
        <div className="rp-label">Architecture</div>
        <pre className="arch-box">
          <span className="hl">Query</span>
          {"\n"}  → embed (OpenAI)
          {"\n"}  → <span className="hl2">S3 Vectors</span>
          {"\n"}  → fetch chunks (RDS)
          {"\n"}  → <span className="hl">Claude API</span>
          {"\n"}  → answer + <span className="hl3">citations</span>
          {"\n"}  → save history
        </pre>
      </div>

      <div className="rp-section">
        <div className="rp-label">Ingest Pipeline</div>
        <pre className="arch-box">
          <span className="hl2">Webhook / Upload</span>
          {"\n"}  → <span className="hl">Lambda A</span> (29s)
          {"\n"}     → S3 originals
          {"\n"}     → SQS queue
          {"\n"}  → <span className="hl">Lambda B</span> (5min)
          {"\n"}     → parse + chunk
          {"\n"}     → embed (batches)
          {"\n"}     → <span className="hl2">S3 Vectors</span>
          {"\n"}     → metadata RDS
        </pre>
      </div>

      <div className="rp-section">
        <div className="rp-label">All Time</div>
        {isLoading ? <div className="sidebar-note">Loading stats…</div> : null}
        {error ? <div className="sidebar-note sidebar-note-error">{error}</div> : null}
        <TechItem
          label="Queries"
          value={String(stats?.allTime.queriesCount ?? 0)}
          highlight
        />
        <TechItem
          label="Avg latency"
          value={`${stats?.allTime.avgLatencyMs ?? 0}ms`}
          highlight
        />
        <TechItem
          label="Docs indexed"
          value={String(stats?.allTime.docsIndexed ?? 0)}
          highlight
        />
        <TechItem
          label="Errors"
          value={String(stats?.allTime.errorsCount ?? 0)}
          highlight={(stats?.allTime.errorsCount ?? 0) === 0}
          warning={(stats?.allTime.errorsCount ?? 0) > 0}
        />
      </div>
    </aside>
  );
}

function TechItem({
  label,
  value,
  highlight,
  warning,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="tech-item">
      <span className="tech-name">{label}</span>
      <span
        className={`tech-val ${highlight ? "tech-val-green" : ""} ${
          warning ? "tech-val-warning" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
