# RAG Streaming Smoothness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make RAG assistant responses stream more smoothly by buffering websocket chunks before rendering and by auto-scrolling only when the user is already near the bottom.

**Architecture:** Keep the websocket protocol unchanged, but split stream handling into two layers on the frontend: a pending chunk buffer in chat state and a visible message body that only flushes on a short cadence or terminal events. Move scroll behavior out of unconditional message-change effects into a small follow-mode controller inside the chat list so the viewport only follows when the user is intentionally at the live tail.

**Tech Stack:** Next.js App Router, React 18, TypeScript, Vitest

---

### Task 1: Buffer streamed chunks before rendering

**Files:**
- Modify: `lib/rag-assistant/types.ts`
- Modify: `lib/rag-assistant/state.ts`
- Modify: `hooks/rag-assistant/useChat.ts`
- Test: `lib/rag-assistant/state.test.ts`

- [ ] **Step 1: Extend the assistant message model with pending streamed text**

Add a hidden buffer field for the active assistant message so websocket chunks can accumulate without forcing visible rerenders.

```ts
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  pendingContent?: string;
  createdAt: string;
  status?: "ready" | "loading" | "error";
  isStreaming?: boolean;
}
```

- [ ] **Step 2: Add reducer support for chunk buffering and flush events**

Keep incoming chunk text in `pendingContent`, add a `stream_flushed` action that moves buffered text into `content`, and make `done_received` / `error_received` / `connection_lost` flush pending text before finalizing.

```ts
export type RagChatAction =
  | { type: "chunk_received"; text: string }
  | { type: "stream_flushed" }
  | { type: "done_received"; event: Extract<WsServerMessage, { type: "done" }> };
```

```ts
case "chunk_received":
  return patchActiveAssistantMessage(..., (message) => ({
    ...message,
    pendingContent: `${message.pendingContent ?? ""}${action.text}`,
    status: "ready",
    isStreaming: true,
  }));

case "stream_flushed":
  return patchActiveAssistantMessage(..., flushPendingMessageContent);
```

- [ ] **Step 3: Add timed flushing in `useChat`**

Schedule a flush when buffered content exists, target a maximum delay of `120ms`, and clear the timer on terminal events before dispatching `done`, `error`, or connection-loss handling.

```ts
const STREAM_FLUSH_DELAY_MS = 120;
const flushTimeoutRef = useRef<number | null>(null);

function scheduleFlush() {
  if (flushTimeoutRef.current !== null) return;
  flushTimeoutRef.current = window.setTimeout(() => {
    flushTimeoutRef.current = null;
    dispatch({ type: "stream_flushed" });
  }, STREAM_FLUSH_DELAY_MS);
}
```

- [ ] **Step 4: Write reducer tests for buffering and terminal flushes**

Add tests proving that chunks stay buffered until `stream_flushed`, and that `done_received` / `error_received` include pending text in final visible content.

```ts
it("buffers chunk text until a flush action arrives", () => {
  const chunked = ragChatReducer(requested, { type: "chunk_received", text: "Hello" });
  expect(chunked.messages[1]?.content).toBe("");
  expect(chunked.messages[1]?.pendingContent).toBe("Hello");
});
```

- [ ] **Step 5: Run targeted reducer tests**

Run: `npm test -- lib/rag-assistant/state.test.ts`

Expected: PASS for the new buffering and flush assertions.

### Task 2: Replace unconditional auto-scroll with follow-mode

**Files:**
- Create: `lib/rag-assistant/scroll.ts`
- Create: `lib/rag-assistant/scroll.test.ts`
- Modify: `components/rag-assistant/chat/MessageList.tsx`
- Modify: `app/demos/rag-assistant/demo.css`

- [ ] **Step 1: Extract pure scroll helpers**

Create helpers for bottom-distance checks using the approved threshold of `96px`.

```ts
export const FOLLOW_BOTTOM_THRESHOLD_PX = 96;

export function isNearBottom(metrics: ScrollMetrics): boolean {
  return metrics.scrollHeight - metrics.clientHeight - metrics.scrollTop <= FOLLOW_BOTTOM_THRESHOLD_PX;
}
```

- [ ] **Step 2: Move `MessageList` to explicit follow-mode state**

Track whether the user is following the bottom, auto-scroll only when that mode is active, and show `Jump to latest` when new visible content arrives while the user is reading higher in the thread.

```tsx
const [isFollowing, setIsFollowing] = useState(true);
const [hasHiddenUpdate, setHasHiddenUpdate] = useState(false);

useLayoutEffect(() => {
  if (!container) return;
  if (isFollowing) {
    container.scrollTop = container.scrollHeight;
    setHasHiddenUpdate(false);
    return;
  }

  if (messages.length > 0) {
    setHasHiddenUpdate(true);
  }
}, [messages, isFollowing]);
```

- [ ] **Step 3: Add the floating affordance styles**

Style a compact button near the bottom-right edge of the chat list so it feels informative, not noisy.

```css
.jump-latest {
  position: absolute;
  right: 18px;
  bottom: 18px;
}
```

- [ ] **Step 4: Test the pure scroll helpers**

Add tests covering the threshold behavior at and beyond `96px`.

```ts
it("treats the viewport as following when within 96px of the bottom", () => {
  expect(isNearBottom({ scrollTop: 804, clientHeight: 200, scrollHeight: 1100 })).toBe(true);
});
```

- [ ] **Step 5: Run targeted scroll helper tests**

Run: `npm test -- lib/rag-assistant/scroll.test.ts`

Expected: PASS for threshold and follow-mode helper assertions.

### Task 3: Verify the full behavior and finish cleanly

**Files:**
- Modify: `app/demos/rag-assistant/page.tsx` (only if new props are needed)
- Verify: `components/rag-assistant/chat/MessageList.tsx`
- Verify: `hooks/rag-assistant/useChat.ts`
- Verify: `lib/rag-assistant/state.ts`

- [ ] **Step 1: Verify the chat wiring still matches the updated API**

If `MessageList` needs extra props such as `isStreaming`, plumb them from `useChat`; otherwise keep the page surface unchanged.

```tsx
const { messages, isStreaming, sendMessage } = useChat();
<MessageList messages={messages} onRetry={sendMessage} />
```

- [ ] **Step 2: Run focused tests for the changed RAG assistant files**

Run: `npm test -- lib/rag-assistant/state.test.ts lib/rag-assistant/scroll.test.ts lib/rag-assistant/message-content.test.ts`

Expected: PASS with no regressions in markdown rendering tests.

- [ ] **Step 3: Run the full project test suite**

Run: `npm test`

Expected: PASS for the full Vitest suite.

- [ ] **Step 4: Run the production build**

Run: `npm run build`

Expected: successful Next.js production build.

- [ ] **Step 5: Commit**

```bash
git add hooks/rag-assistant/useChat.ts \
  lib/rag-assistant/types.ts \
  lib/rag-assistant/state.ts \
  lib/rag-assistant/state.test.ts \
  lib/rag-assistant/scroll.ts \
  lib/rag-assistant/scroll.test.ts \
  components/rag-assistant/chat/MessageList.tsx \
  app/demos/rag-assistant/demo.css \
  docs/superpowers/plans/2026-04-03-rag-streaming-smoothness.md
git commit -m "feat: smooth rag assistant streaming"
```
