# RAG Assistant Streaming Smoothness Design

Date: 2026-04-03
Status: Approved for planning

## Summary

The current RAG assistant UI streams responses in a way that feels visually harsh. Two issues stand out:

- streamed text visibly jumps as small chunks arrive and the rendered layout keeps changing;
- the chat list force-scrolls to the bottom while the user is trying to read from the top of the answer.

This design changes the frontend behavior so streaming feels closer to ChatGPT and Claude: the response still appears live, but it is rendered in calm batches, and auto-scroll follows the tail only when the user is already near the bottom.

## Scope

In scope:

- smooth streamed rendering for the RAG assistant chat;
- follow-mode scroll behavior that respects manual reading position;
- a lightweight `Jump to latest` affordance when new streamed content arrives outside follow-mode;
- reducer and component changes needed to support buffered rendering;
- automated tests for buffering and scroll behavior.

Out of scope:

- backend websocket protocol changes;
- visual redesign of the chat surface beyond the new affordance;
- changes to CV-screening streaming behavior;
- fake typewriter animation.

## Current State

The current implementation updates the active assistant message on every incoming websocket `chunk` and `MessageList` forces `scrollTop = scrollHeight` whenever `messages` changes.

Relevant code paths:

- `hooks/rag-assistant/useChat.ts`
- `lib/rag-assistant/state.ts`
- `components/rag-assistant/chat/MessageList.tsx`
- `components/rag-assistant/chat/Message.tsx`

This creates two UX problems:

1. Frequent content mutations make paragraphs reflow too often during streaming.
2. The scroll container repeatedly snaps to the bottom, even when the user has moved up to read the beginning of the answer.

## Goals

- Preserve the feeling of a live answer.
- Remove harsh visual jumps caused by micro-chunk rendering.
- Auto-scroll only when the user is intentionally following the newest content.
- Let the user read older parts of the answer without losing their place.
- Keep the behavior predictable on `done`, `error`, and reconnect-related failure paths.

## Non-Goals

- Mimic the exact proprietary implementation of ChatGPT or Claude.
- Delay the answer enough to make streaming feel fake.
- Introduce a fully virtualized message list.
- Change message markdown parsing rules unless required by the buffering model.

## Chosen Approach

The frontend will separate the incoming websocket stream from the text that is currently visible on screen.

### Layer 1: Raw Stream Buffer

Incoming websocket `chunk` events are appended immediately to a pending buffer for the active assistant message.

This layer exists to preserve all incoming text with minimal logic and without forcing the full message UI to update on every micro-chunk.

### Layer 2: Visible Stream

The UI publishes buffered text into the rendered assistant message in controlled batches. Flushes happen on a short cadence rather than once per websocket event.

The visible result should still look live, but the number of layout shifts should drop substantially.

## Proposed Behavior

### Streaming cadence

- Buffer incoming text as soon as it arrives.
- Flush buffered text to the visible message on a short cadence.
- The cadence should feel responsive, not cinematic.
- `done` must flush any remaining buffered text immediately.
- `error` must also flush remaining text before appending the error state.

The implementation should target a maximum flush delay of about `120ms`, with immediate flush on terminal events. This keeps the answer feeling live while avoiding per-chunk jitter.

### Follow-mode scroll

The chat list tracks whether the user is considered "near the bottom".

- The user is in follow-mode when the remaining distance to the bottom is `96px` or less.
- Auto-scroll is allowed only while follow-mode is active.
- If the user scrolls upward beyond that threshold, follow-mode turns off immediately.
- New streamed content must not pull the viewport downward while follow-mode is off.
- If the user manually returns to the bottom, follow-mode turns back on automatically.

### Jump to latest affordance

When new streamed content appears while follow-mode is off:

- show a small `Jump to latest` control;
- indicate that the answer is still streaming if applicable;
- hide the control once the user returns to the bottom.

This gives the user an explicit way to rejoin the live tail of the response without forced motion.

### Behavior on send

When the user sends a new message:

- if they are already in follow-mode, the chat may softly move to the newest response area;
- if they are not in follow-mode, sending must not aggressively reset their reading position.

This keeps the behavior consistent with the rule that scroll should follow user intent, not assume it.

## Architecture Changes

### State model

The active assistant response needs to distinguish between:

- text received from the websocket;
- text already published to the visible message;
- whether there is unpublished streamed content while the user is not following the bottom.

The implementation may store this as explicit reducer fields or as equivalent derived state, but the separation must be clear and testable.

### Rendering model

`Message` should render only the currently published content for the active assistant message. Pending text remains outside the visible markdown render path until the next flush.

This avoids reparsing and rerendering the full message tree for every incoming chunk.

### Scroll controller

`MessageList` should stop doing unconditional `scrollTop = scrollHeight` on every `messages` update.

Instead, it should:

- observe the user scroll position;
- track whether follow-mode is active;
- perform scroll updates only after a visible flush and only when follow-mode is active;
- surface whether hidden streamed content exists so the `Jump to latest` control can be shown.

## Error Handling

- `done`: flush remaining pending text, finalize metadata, clear streaming state.
- `error`: flush remaining pending text, preserve the readable partial answer, then show the error state.
- connection lost: preserve visible partial text and avoid any forced scroll jump.
- very short answers: appear almost immediately and not wait on a long timer.
- sparse chunk arrival: remain responsive even when chunks arrive irregularly.

## Testing Strategy

Add or update automated tests for:

- buffering incoming chunks without publishing each one immediately;
- publishing pending text on scheduled flush;
- forcing a final flush on `done`;
- forcing a final flush on `error`;
- follow-mode remaining enabled near the bottom;
- follow-mode turning off after user scrolls away from the bottom;
- no auto-scroll while follow-mode is off;
- returning to the bottom re-enabling follow-mode;
- `Jump to latest` appearing and disappearing at the correct times.

## Risks And Mitigations

- Risk: buffering makes the answer feel delayed.
  Mitigation: keep flush cadence short and force immediate flush on terminal events.

- Risk: scroll logic becomes brittle across varying message heights.
  Mitigation: use a bottom threshold and test behavior around that boundary.

- Risk: markdown parsing still causes large reflows on every flush for long answers.
  Mitigation: keep flushes coarse enough to reduce churn and limit updates to the active message path.

## Acceptance Criteria

- Streaming answers feel visually calmer than the current per-chunk rendering.
- Reading from the top of a streaming answer no longer gets interrupted by forced scroll-to-bottom behavior.
- Users near the bottom still get a live follow experience.
- Users away from the bottom get a clear but non-intrusive way to jump back to the latest content.
- Partial answers remain readable on failures.
