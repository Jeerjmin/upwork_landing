import type { ReactNode } from "react";

interface HeroProps {
  eyebrow: string;
  titleLine1: string;
  titleEmphasis: string;
  titleLine2Remainder: string;
  titleLine3: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  sidePanel?: ReactNode;
}

export function Hero({
  eyebrow,
  titleLine1,
  titleEmphasis,
  titleLine2Remainder,
  titleLine3,
  description,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  sidePanel,
}: HeroProps) {
  return (
    <section className="hero">
      <div className="wrap">
        <div className="hero-grid">
          <div className="hero-left">
            <div className="hero-eyebrow">{eyebrow}</div>
            <h1>
              {titleLine1}
              <br />
              <em>{titleEmphasis}</em> {titleLine2Remainder}
              <br />
              {titleLine3}
            </h1>
            <p className="hero-sub">{description}</p>
            <div className="hero-ctas">
              <a href={primaryCtaHref} className="btn-primary">
                {primaryCtaLabel}
              </a>
              <a
                href={secondaryCtaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                {secondaryCtaLabel}
              </a>
            </div>
          </div>
          {sidePanel ? <div className="hero-right">{sidePanel}</div> : null}
        </div>
      </div>
    </section>
  );
}
