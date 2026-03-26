import { CtaSection } from "@/components/CtaSection";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ProblemCard, type ProblemCardProps } from "@/components/ProblemCard";
import { ProofSection } from "@/components/ProofSection";
import { TrustBar } from "@/components/TrustBar";

const siteConfig = {
  upworkUrl: "https://www.upwork.com",
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
    secondaryCtaLabel: "My Upwork profile →",
  },
  trustBar: {
    items: [
      {
        color: "green",
        icon: "check",
        title: "Senior backend engineer",
        description: "Go · Node.js · AWS — 7+ years",
      },
      {
        color: "amber",
        icon: "bolt",
        title: "Lamoda — 30M users",
        description: "20M+ events/day at scale",
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
        tag: "Document processing",
        title: "Your team manually reads every PDF, invoice, and contract",
        description:
          "An email arrives with a PDF. Someone opens it, copies numbers into a spreadsheet, forwards the results. Hours later. With mistakes. I replace that entire loop with an AI agent that does it in seconds — and flags anything it's unsure about for human review.",
        demoUrl: "https://example.com/document-processing-demo",
        githubUrl: "https://github.com/your-username/document-processing-demo",
        beforeText:
          "Employee opens PDF, manually extracts data, enters into system. 15–45 min per document. ~5% error rate.",
        afterText:
          "Email arrives → extracted in seconds → written to your system → Slack notification. Human only reviews flagged items.",
        resultText: "Processing time cut by ~95%",
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
      {
        colorVariant: "c3",
        tag: "Lead qualification",
        title: "Good leads go cold while you're busy with bad ones",
        description:
          "A lead messages on WhatsApp or fills a form. Your team responds hours later — if at all. By then they've moved on. I build an AI agent that responds in under a minute, scores the lead, updates your CRM, and only pings your team for the hot ones.",
        demoUrl: "https://example.com/lead-qualification-demo",
        githubUrl: "https://github.com/your-username/lead-qualification-demo",
        beforeText:
          "Lead submits form. Someone checks it 3 hours later. Manual reply. Forgets to update HubSpot. Hot lead goes cold.",
        afterText:
          "Lead arrives → AI responds in <60s → scored + logged in CRM → team gets a Slack ping only for hot leads.",
        resultText: "Works with WhatsApp, HubSpot, Airtable",
      },
    ] satisfies Omit<ProblemCardProps, "labels">[],
  },
  proof: {
    quoteBefore: "The same engineering discipline I used to process ",
    quoteEmphasis: "20 million events a day at Lamoda",
    quoteAfter: " — now applied to your business.",
    sourceLabel: "Background ·",
    sourceText: "Lamoda, Eastern Europe's largest fashion e-commerce · 30M users",
    metrics: [
      {
        label: "Events/day at Lamoda",
        value: "20,000,000+",
        valueClassName: "hi",
      },
      {
        label: "Engineering experience",
        value: "7+ years",
      },
      {
        label: "Core stack",
        value: "Go · Node.js · AWS",
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
      <Header
        logoPrefix={siteConfig.header.logoPrefix}
        logoHighlight={siteConfig.header.logoHighlight}
        logoSuffix={siteConfig.header.logoSuffix}
        upworkLabel={siteConfig.header.upworkLabel}
        upworkUrl={siteConfig.upworkUrl}
      />
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
        secondaryCtaHref={siteConfig.upworkUrl}
      />
      <TrustBar items={siteConfig.trustBar.items} />
      <section id="demos">
        <div className="wrap">
          <div className="section-title">
            <div className="section-label">{siteConfig.demos.sectionLabel}</div>
            <h2>
              {siteConfig.demos.titleLine1}
              <br />
              <em>{siteConfig.demos.titleEmphasis}</em>
            </h2>
          </div>

          <div className="problems">
            {siteConfig.demos.cards.map((card) => (
              <ProblemCard
                key={card.title}
                {...card}
                labels={siteConfig.demos.cardLabels}
              />
            ))}
          </div>

          <ProofSection
            quoteBefore={siteConfig.proof.quoteBefore}
            quoteEmphasis={siteConfig.proof.quoteEmphasis}
            quoteAfter={siteConfig.proof.quoteAfter}
            sourceLabel={siteConfig.proof.sourceLabel}
            sourceText={siteConfig.proof.sourceText}
            metrics={siteConfig.proof.metrics}
          />

          <CtaSection
            titleLine1={siteConfig.cta.titleLine1}
            titleLine2Prefix={siteConfig.cta.titleLine2Prefix}
            titleEmphasis={siteConfig.cta.titleEmphasis}
            titleLine2Suffix={siteConfig.cta.titleLine2Suffix}
            descriptionLine1={siteConfig.cta.descriptionLine1}
            descriptionLine2={siteConfig.cta.descriptionLine2}
            buttonLabel={siteConfig.cta.buttonLabel}
            buttonUrl={siteConfig.upworkUrl}
            note={siteConfig.cta.note}
          />
        </div>
      </section>
      <Footer note={siteConfig.footer.note} links={footerLinks} />
    </>
  );
}
