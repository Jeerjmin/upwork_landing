export interface ProblemCardProps {
  colorVariant: "c1" | "c2" | "c3";
  tag: string;
  title: string;
  description: string;
  demoUrl: string;
  githubUrl: string;
  beforeText: string;
  afterText: string;
  resultText: string;
  labels: {
    problem: string;
    panel: string;
    before: string;
    after: string;
    demo: string;
    github: string;
  };
}

export function ProblemCard({
  colorVariant,
  tag,
  title,
  description,
  demoUrl,
  githubUrl,
  beforeText,
  afterText,
  resultText,
  labels,
}: ProblemCardProps) {
  return (
    <div className={`prob-card ${colorVariant}`}>
      <div className="prob-inner">
        <div className="prob-left">
          <div>
            <div className="prob-tag">{tag}</div>
            <p className="prob-problem">{labels.problem}</p>
            <h3 className="prob-title">{title}</h3>
            <p className="prob-desc">{description}</p>
          </div>
          <div className="prob-cta">
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-demo"
            >
              {labels.demo} <span className="arr">↗</span>
            </a>
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gh"
            >
              {labels.github}
            </a>
          </div>
        </div>
        <div className="prob-right">
          <div className="panel-label">{labels.panel}</div>
          <div className="before-after">
            <div className="ba-row">
              <div className="ba-label before-lbl">{labels.before}</div>
              <div className="ba-text">{beforeText}</div>
            </div>
            <div className="ba-row after">
              <div className="ba-label after-lbl">{labels.after}</div>
              <div className="ba-text">{afterText}</div>
              <div className="result-pill">
                <svg
                  width="11"
                  height="11"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                {resultText}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
