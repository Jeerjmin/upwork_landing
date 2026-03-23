interface CtaSectionProps {
  titleLine1: string;
  titleLine2Prefix: string;
  titleEmphasis: string;
  titleLine2Suffix: string;
  descriptionLine1: string;
  descriptionLine2: string;
  buttonLabel: string;
  buttonUrl: string;
  note: string;
}

export function CtaSection({
  titleLine1,
  titleLine2Prefix,
  titleEmphasis,
  titleLine2Suffix,
  descriptionLine1,
  descriptionLine2,
  buttonLabel,
  buttonUrl,
  note,
}: CtaSectionProps) {
  return (
    <div className="cta-section">
      <div className="cta-card">
        <h2>
          {titleLine1}
          <br />
          {titleLine2Prefix} <em>{titleEmphasis}</em> {titleLine2Suffix}
        </h2>
        <p className="cta-sub">
          {descriptionLine1}
          <br />
          {descriptionLine2}
        </p>
        <div className="cta-buttons">
          <a
            href={buttonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-big"
          >
            {buttonLabel}
          </a>
        </div>
        <p className="cta-note">{note}</p>
      </div>
    </div>
  );
}
