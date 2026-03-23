# Portfolio → Next.js migration

## Context

This directory contains `demo-hub.html` — a finished, pixel-perfect portfolio page.  
Your job is to migrate it to Next.js 14 (App Router) with Vercel CI/CD.

**Do not redesign anything.** Every color, font, spacing, animation, and copy decision is final.  
Treat `demo-hub.html` as the single source of truth.

---

## Stack

- Next.js 14, App Router, TypeScript
- Tailwind CSS (utility classes only where they map cleanly; CSS variables for the design system)
- Google Fonts via `next/font/google`
- Vercel deployment via GitHub integration

---

## Step 1 — Scaffold

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --eslint
```

---

## Step 2 — Design system

Open `demo-hub.html` and extract the full `<style>` block.

In `app/globals.css`:
- Copy all `:root` CSS variables exactly as they are
- Copy the `body::before` grid texture rule
- Copy base `body` styles
- Copy `@keyframes fadeUp`

In `app/layout.tsx`:
- Load fonts via `next/font/google`: **DM Mono** (weights 300,400,500), **Instrument Serif** (italic subset), **DM Sans** (weights 300,400,500)
- Apply font CSS variables (`--mono`, `--serif`, `--sans`) on the `<html>` element
- Set `<title>` and `<meta name="description">` matching the page

---

## Step 3 — Components

Create one file per component in `/components`. Each component must match the HTML exactly — same class names, same structure, same copy.

| File | Corresponds to in HTML |
|------|----------------------|
| `Header.tsx` | `<header>` block |
| `Hero.tsx` | `<section class="hero">` |
| `TrustBar.tsx` | `<div class="trust-bar">` |
| `ProblemCard.tsx` | `.prob-card` — reusable, accepts props (see below) |
| `ProofSection.tsx` | `.proof-section` |
| `CtaSection.tsx` | `.cta-section` |
| `Footer.tsx` | `<footer>` |

### ProblemCard props interface

```ts
interface ProblemCardProps {
  colorVariant: 'c1' | 'c2' | 'c3'   // maps to .prob-card.c1/c2/c3
  tag: string
  title: string
  description: string
  demoUrl: string
  githubUrl: string
  beforeText: string
  afterText: string
  resultText: string
}
```

---

## Step 4 — Page

In `app/page.tsx`:

1. Define a single `siteConfig` object at the top with all editable content — URLs, copy, card data. No hardcoded strings in JSX.
2. Assemble the page by importing and rendering all components in order: `Header → Hero → TrustBar → (3× ProblemCard) → ProofSection → CtaSection → Footer`

```ts
const siteConfig = {
  upworkUrl: 'https://www.upwork.com/...',   // replace
  githubUrl:  'https://github.com/...',       // replace
  email:      'your@email.com',               // replace
  // ... rest of copy
}
```

---

## Step 5 — CI/CD

**`vercel.json`** in root:
```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "outputDirectory": ".next"
}
```

**`.github/workflows/ci.yml`** — runs on every push and PR to `main`:
```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
```

Vercel deployment itself is handled by the Vercel GitHub integration (no CLI needed). After pushing, connect the repo once at vercel.com → New Project → Import.

**`.env.example`**:
```
# Add future env vars here, never commit .env.local
```

---

## Step 6 — Verify

Run these checks before marking done:

```bash
npm run build        # must complete with zero errors
npm run lint         # must pass
```

Also confirm:
- [ ] Fonts render correctly (no FOUT flash)
- [ ] `fadeUp` animations fire on page load
- [ ] All external links have `target="_blank" rel="noopener noreferrer"`
- [ ] Mobile layout matches HTML at 375px (grid collapses to single column)
- [ ] No hardcoded `#` in demo/github links — they should come from `siteConfig`
