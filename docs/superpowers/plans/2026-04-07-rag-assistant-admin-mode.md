# RAG Assistant Admin Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide Upload buttons for normal users, and show them only when `/demos/rag-assistant?admin=<token>` matches a public env token; also remove the sidebar totals stats grid (`total chunks`, `documents`, `indexed size`).

**Architecture:** Compute `isAdmin` on the client from `useSearchParams()` and `process.env.NEXT_PUBLIC_RAG_ASSISTANT_ADMIN_TOKEN`. Thread `isAdmin` as a prop into `TopBar` and `Sidebar` to conditionally render the Upload buttons. Remove the `stats-grid` UI from the sidebar and stop passing `totals` into it.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript.

---

### Task 1: Add public env var for admin token

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add the new public env var**

Add:

```dotenv
NEXT_PUBLIC_RAG_ASSISTANT_ADMIN_TOKEN=89116002561
```

- [ ] **Step 2: Verify build-time access pattern**

Ensure we only read it in client code as `process.env.NEXT_PUBLIC_RAG_ASSISTANT_ADMIN_TOKEN`.

---

### Task 2: Compute `isAdmin` in `rag-assistant` page

**Files:**
- Modify: `app/demos/rag-assistant/page.tsx`

- [ ] **Step 1: Read admin query param**

Use:

```ts
import { useSearchParams } from "next/navigation";

const searchParams = useSearchParams();
const adminParam = searchParams.get("admin");
const isAdmin =
  Boolean(process.env.NEXT_PUBLIC_RAG_ASSISTANT_ADMIN_TOKEN) &&
  adminParam === process.env.NEXT_PUBLIC_RAG_ASSISTANT_ADMIN_TOKEN;
```

- [ ] **Step 2: Pass `isAdmin` to `TopBar` and `Sidebar`**

---

### Task 3: Hide Upload buttons unless `isAdmin`

**Files:**
- Modify: `components/rag-assistant/layout/TopBar.tsx`
- Modify: `components/rag-assistant/layout/Sidebar.tsx`

- [ ] **Step 1: Extend props with `isAdmin`**
- [ ] **Step 2: Conditionally render Upload buttons**

TopBar:
- render the `+ Upload` button only if `isAdmin`

Sidebar:
- render the `Upload` button only if `isAdmin`

---

### Task 4: Remove sidebar totals stats grid

**Files:**
- Modify: `components/rag-assistant/layout/Sidebar.tsx`
- Modify: `app/demos/rag-assistant/page.tsx`

- [ ] **Step 1: Delete the `stats-grid` JSX**
- [ ] **Step 2: Remove `totals` prop plumbing**

---

### Task 5: Verification

**Files:**
- (no new files)

- [ ] **Step 1: Typecheck/build**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 2: Check lints for touched files**

Use editor diagnostics; fix any new issues introduced by prop changes.

