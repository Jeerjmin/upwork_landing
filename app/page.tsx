// import { CtaSection } from "@/components/CtaSection";
import { Footer } from "@/components/Footer";
// import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ProblemCard, type ProblemCardProps } from "@/components/ProblemCard";
import { ProofSection } from "@/components/ProofSection";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { TrustBar } from "@/components/TrustBar";

const siteConfig = {
  upworkUrl: "https://www.upwork.com",
  linkedinUrl: "https://www.linkedin.com/in/oleg-t-687078191/?skipRedirect=true",
  githubUrl: "https://github.com/your-username",
  email: "your@email.com",
  header: {
    logoPrefix: "AI ",
    logoHighlight: "Automation",
    logoSuffix: " Engineer",
    upworkLabel: "Hire me on Upwork ↗",
  },
  hero: {
    eyebrow: "Available for new projects",
    titleLine1: "Your business runs on",
    titleEmphasis: "manual work",
    titleLine2Remainder: "that",
    titleLine3: "AI should handle",
    description:
      "I build production AI systems that automate document processing, answer your team's questions instantly, and qualify leads while you sleep. Not demos — working systems delivered in 1–2 weeks.",
    primaryCtaLabel: "See it working ↓",
    primaryCtaHref: "#demos",
    secondaryCtaLabel: "My LinkedIn profile →",
  },
  trustBar: {
    items: [
      {
        color: "amber",
        icon: "bolt",
        title: "Production engineer, 7+ years",
        description: "Go · Node.js · AWS · tens-of-millions scale",
      },
      {
        color: "blue",
        icon: "clock",
        title: "Delivery in 1–2 weeks",
        description: "Fixed price or hourly",
      },
    ],
  },
  demos: {
    sectionLabel: "What I build",
    titleLine1: "Three problems.",
    titleEmphasis: "All solved.",
    cardLabels: {
      problem: "The problem",
      panel: "Before / After",
      before: "Before",
      after: "After",
      demo: "Live demo",
      github: "GitHub →",
    },
    cards: [
      {
        colorVariant: "c1",
        tag: "Hiring AI",
        title: "Your team manually screens every CV and application PDF",
        description:
          "A role opens, CVs start arriving, and recruiters spend hours scanning for fit, risks, and interview angles. I replace that first-pass review with an AI workflow that reads each CV in seconds, scores fit against the role, and highlights what actually needs human judgment.",
        demoUrl: "/demos/cv-screening",
        githubUrl: "https://github.com/your-username/document-processing-demo",
        beforeText:
          "Recruiter opens CV, compares it against the JD by hand, writes notes, and still misses weak signals. 10–20 min per candidate.",
        afterText:
          "CV arrives → scored against the role in seconds → profile, flags, and fit summary generated instantly.",
        resultText: "First-pass screening cut to seconds",
      },
      {
        colorVariant: "c2",
        tag: "Internal knowledge",
        title: "Your team asks the same questions over and over",
        description:
          "\"Where's that policy doc?\" \"What were the specs for client X?\" The answer is buried in Notion, Google Drive, or a PDF nobody can find. I build an AI assistant trained on your own documents that answers instantly and always shows the source.",
        demoUrl: "/demos/rag-assistant",
        githubUrl: "https://github.com/your-username/internal-knowledge-demo",
        beforeText:
          "Team member asks in Slack, waits for a colleague, gets a link to the wrong doc. Or just guesses.",
        afterText:
          "Ask the AI in Slack or a chat UI. Searches your documents, answers in seconds, shows the exact source.",
        resultText: "Works with Notion, Drive, PDFs",
      },
      // {
      //   colorVariant: "c3",
      //   tag: "Lead qualification",
      //   title: "Good leads go cold while you're busy with bad ones",
      //   description:
      //     "A lead messages on WhatsApp or fills a form. Your team responds hours later — if at all. By then they've moved on. I build an AI agent that responds in under a minute, scores the lead, updates your CRM, and only pings your team for the hot ones.",
      //   demoUrl: "https://example.com/lead-qualification-demo",
      //   githubUrl: "https://github.com/your-username/lead-qualification-demo",
      //   beforeText:
      //     "Lead submits form. Someone checks it 3 hours later. Manual reply. Forgets to update HubSpot. Hot lead goes cold.",
      //   afterText:
      //     "Lead arrives → AI responds in <60s → scored + logged in CRM → team gets a Slack ping only for hot leads.",
      //   resultText: "Works with WhatsApp, HubSpot, Airtable",
      // },
    ] satisfies Omit<ProblemCardProps, "labels">[],
  },
  proof: {
    quoteBefore: "SQS, DLQ, idempotent retry, audit logs — ",
    quoteEmphasis: "from day one.",
    quoteAfter: " Not as an afterthought when things break in production.",
    sourceLabel: "7+ years ·",
    sourceText: "Eastern Europe's largest fashion e-commerce",
    metrics: [
      {
        label: "Scale",
        value: "tens-of-millions of users",
        valueClassName: "hi",
      },
      {
        label: "Infrastructure",
        value: "Lambda · S3 Vectors · CDK",
      },
      {
        label: "Languages",
        value: "Go · Node.js · PostgreSQL",
      },
      {
        label: "Ready to deploy",
        value: "3 live templates",
        valueClassName: "am",
      },
    ],
  },
  cta: {
    titleLine1: "Does one of these sound",
    titleLine2Prefix: "like",
    titleEmphasis: "your",
    titleLine2Suffix: "problem?",
    descriptionLine1: "Send me a message on Upwork. Describe what you're dealing with.",
    descriptionLine2: "I'll respond within a few hours with a concrete plan.",
    buttonLabel: "Message me on Upwork ↗",
    note: "Typical project: 1–2 weeks · $1,500–$5,000 · Fixed price or hourly",
  },
  footer: {
    note: "AWS · Node.js · Go",
  },
} as const;

export default function Home() {
  const footerLinks = [
    { label: "Upwork", href: siteConfig.upworkUrl },
    { label: "GitHub", href: siteConfig.githubUrl },
    { label: "Email", href: `mailto:${siteConfig.email}` },
  ];

  return (
    <>
      <Hero
        eyebrow={siteConfig.hero.eyebrow}
        titleLine1={siteConfig.hero.titleLine1}
        titleEmphasis={siteConfig.hero.titleEmphasis}
        titleLine2Remainder={siteConfig.hero.titleLine2Remainder}
        titleLine3={siteConfig.hero.titleLine3}
        description={siteConfig.hero.description}
        primaryCtaLabel={siteConfig.hero.primaryCtaLabel}
        primaryCtaHref={siteConfig.hero.primaryCtaHref}
        secondaryCtaLabel={siteConfig.hero.secondaryCtaLabel}
        secondaryCtaHref={siteConfig.linkedinUrl}
        sidePanel={
          <ProofSection
            variant="embedded"
            quoteBefore={siteConfig.proof.quoteBefore}
            quoteEmphasis={siteConfig.proof.quoteEmphasis}
            quoteAfter={siteConfig.proof.quoteAfter}
            sourceLabel={siteConfig.proof.sourceLabel}
            sourceText={siteConfig.proof.sourceText}
            metrics={siteConfig.proof.metrics}
          />
        }
      />
      <TrustBar items={siteConfig.trustBar.items} />
      <section id="demos">
        <div className="wrap">
          <RevealOnScroll className="section-title reveal">
            <div>
              <div className="section-label">{siteConfig.demos.sectionLabel}</div>
              <h2>
                <em>{siteConfig.demos.titleEmphasis}</em>
              </h2>
            </div>
          </RevealOnScroll>

          <div className="problems">
            {siteConfig.demos.cards.map((card, i) => (
              <RevealOnScroll
                key={card.title}
                className={`reveal reveal-d${i + 1}`}
              >
                <ProblemCard
                  {...card}
                  labels={siteConfig.demos.cardLabels}
                />
              </RevealOnScroll>
            ))}
          </div>

          {/* <CtaSection
            titleLine1={siteConfig.cta.titleLine1}
            titleLine2Prefix={siteConfig.cta.titleLine2Prefix}
            titleEmphasis={siteConfig.cta.titleEmphasis}
            titleLine2Suffix={siteConfig.cta.titleLine2Suffix}
            descriptionLine1={siteConfig.cta.descriptionLine1}
            descriptionLine2={siteConfig.cta.descriptionLine2}
            buttonLabel={siteConfig.cta.buttonLabel}
            buttonUrl={siteConfig.upworkUrl}
            note={siteConfig.cta.note}
          /> */}
        </div>
      </section>
      <Footer note={siteConfig.footer.note} links={footerLinks} />
    </>
  );
}
