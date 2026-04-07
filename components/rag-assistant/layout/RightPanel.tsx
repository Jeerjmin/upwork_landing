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
        <div className="rp-label">Agentic flow</div>
        <pre className="arch-box">
          <span className="hl">Your question</span>
          {"\n"}  → Agent classifies intent
          {"\n"}  → Picks a retrieval strategy
          {"\n"}  → Runs multi-step verification
          {"\n"}  → <span className="hl3">Grounded answer</span> with{" "}
          <span className="hl3">citations</span>
        </pre>
      </div>

      <div className="rp-section">
        <div className="rp-label">What makes it agentic</div>
        <ul className="rp-bullets">
          <li>Autonomously decides how to answer each query</li>
          <li>Re-ranks and cross-checks across documents</li>
          <li>Chains multiple retrieval steps when one is not enough</li>
          <li>Every answer traced back to source passages</li>
        </ul>
      </div>

      <div className="rp-section">
        <div className="rp-label">Session</div>
        {isLoading ? <div className="sidebar-note">Loading…</div> : null}
        {error ? (
          <div className="sidebar-note sidebar-note-error">{error}</div>
        ) : null}
        <HighlightItem
          label="Questions answered"
          value={String(stats?.allTime.queriesCount ?? 0)}
        />
        <HighlightItem
          label="Documents indexed"
          value={String(stats?.allTime.docsIndexed ?? 0)}
        />
        <HighlightItem
          label="Avg response time"
          value={`${stats?.allTime.avgLatencyMs ?? 0} ms`}
        />
      </div>

      <div className="rp-powered">
        Powered by {modelName} · {embeddingModel} · AWS
      </div>
    </aside>
  );
}

function HighlightItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="tech-item">
      <span className="tech-name">{label}</span>
      <span className="tech-val tech-val-green">{value}</span>
    </div>
  );
}
