# RAG Assistant — Product Story Redesign

**Goal:** Transform the RAG assistant demo from an engineering console into a polished client demo. The viewer should read "the assistant understands my question, picks the best path, and transparently shows how it arrived at the answer" within 5-10 seconds.

**Scope:** Frontend-only changes. No new API contracts, no backend modifications.

---

## 1. Right Panel → Product Story Panel

Replace all four current sections (Stack, Architecture, Ingest Pipeline, All Time) with:

### Section "How it works"
Static flow in `arch-box` style (monospace, dark background):
```
Your question
  → Understands intent & complexity
  → Chooses the best search strategy
  → Verifies across multiple documents
  → Grounded answer with citations
```

### Section "Why answers are grounded"
3-4 short bullets:
- Cross-references multiple document sections
- Shows source citations inline
- Confidence score on every answer
- Multi-step verification when needed

### Section "Session highlights"
Live data from existing `stats` endpoint:
- Questions answered: `stats.allTime.queriesCount`
- Documents in knowledge base: `stats.allTime.docsIndexed`
- Avg response time: `stats.allTime.avgLatencyMs` ms

Errors metric removed — not relevant for client-facing view.

### Footer "Powered by"
Single line, small text, bottom of panel:
`Powered by Claude Sonnet 4.5 · OpenAI Embeddings · AWS`

---

## 2. Sidebar Cleanup

- Header: "Indexed Documents" → "Documents"
- Each document: file name + status dot only
- Remove: chunk count and file size ("42 chunks · 1.2MB")
- Upload button stays behind `isAdmin` (already implemented)

---

## 3. Empty State — Capability Showcase

Replace current text with:
- Heading: "What can I help you with?"
- 4 clickable prompt cards (click = send as message):
  1. "Summarize key risk factors from the annual report"
  2. "What was the net revenue in Q3 2025?"
  3. "Compare operating margins across quarterly reports"
  4. "What financial documents are available?"
- Subtext removed ("I will search indexed chunks...")

---

## 4. Copywriting Tweaks

| Location | Before | After |
|----------|--------|-------|
| Input placeholder | "Ask anything about your knowledge base…" | "Ask a question…" |
| Loading badge | "searching" | "thinking" |
| Agent trace label | "Searching 1: {query}" | "Checking: {query}" |
| Empty state title | "Ask anything about your knowledge base" | "What can I help you with?" |

---

## 5. What stays unchanged

- TopBar (logo, badges, status indicators, admin upload)
- Chat mechanics (Message, SourceChip, SourceCite, ConfidenceBar, streaming)
- Color scheme and CSS variables
- Agent trace UI structure (only label text changes)
- WebSocket / API contracts

---

## Files to modify

| File | Change |
|------|--------|
| `components/rag-assistant/layout/RightPanel.tsx` | Full rewrite: product-story sections + powered-by footer |
| `components/rag-assistant/layout/Sidebar.tsx` | Rename header, remove meta details from doc items |
| `components/rag-assistant/chat/MessageList.tsx` | New empty state with prompt cards |
| `components/rag-assistant/chat/InputArea.tsx` | Update placeholder text |
| `components/rag-assistant/chat/Message.tsx` | "searching" → "thinking" badge |
| `lib/rag-assistant/trace.ts` | "Searching N:" → "Checking:" |
| `app/demos/rag-assistant/demo.css` | New styles for prompt cards, powered-by footer; remove unused arch-box styles if orphaned |
| `app/demos/rag-assistant/page.tsx` | Pass `onSend` to MessageList for prompt card clicks |
