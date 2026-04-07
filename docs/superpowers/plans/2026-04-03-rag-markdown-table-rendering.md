# RAG Markdown Table Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render standard markdown tables in the RAG assistant chat, including live streaming rows, without changing the backend API.

**Architecture:** Extend the existing custom markdown parser with a `table` block instead of swapping to a full markdown library. Keep parsing on the full accumulated assistant message so the UI can reinterpret streamed text into a `<table>` as soon as the delimiter row arrives, then render that block in the existing message component with focused chat-native styling.

**Tech Stack:** Next.js App Router, React 18, TypeScript, Vitest

---

### Task 1: Lock the parser contract with failing tests

**Files:**
- Modify: `lib/rag-assistant/message-content.test.ts`
- Verify: `lib/rag-assistant/message-content.ts`

- [ ] **Step 1: Add a failing test for complete markdown tables**

Add a parser expectation for a header row, delimiter row, and one body row so the missing `table` block is explicit.

```ts
it("parses a complete markdown table into a table block", () => {
  expect(
    parseAssistantMarkdown(
      [
        "| Company | Revenue |",
        "| --- | --- |",
        "| Amazon | $637B |",
      ].join("\n"),
    ),
  ).toEqual([
    {
      type: "table",
      headers: ["Company", "Revenue"],
      rows: [["Amazon", "$637B"]],
      isPartialLastRow: false,
    },
  ]);
});
```

- [ ] **Step 2: Add failing tests for streaming and non-table text**

Cover the two critical boundaries: text with pipes but no delimiter stays a paragraph, and an incomplete final row still renders as a partial table row.

```ts
it("keeps pipe-delimited text as a paragraph when no delimiter row exists", () => {
  expect(parseAssistantMarkdown("Revenue | Margin")).toEqual([
    { type: "paragraph", text: "Revenue | Margin" },
  ]);
});

it("parses a streamed partial last row", () => {
  expect(
    parseAssistantMarkdown(
      [
        "| Company | Revenue |",
        "| --- | --- |",
        "| Amazon | $637",
      ].join("\n"),
    ),
  ).toEqual([
    {
      type: "table",
      headers: ["Company", "Revenue"],
      rows: [["Amazon", "$637"]],
      isPartialLastRow: true,
    },
  ]);
});
```

- [ ] **Step 3: Add a failing test for table termination and inline tokens**

Make sure the parser preserves cell text for existing inline rendering and cleanly starts a paragraph after the table ends.

```ts
it("parses a table followed by a paragraph", () => {
  expect(
    parseAssistantMarkdown(
      [
        "| Company | Note |",
        "| --- | --- |",
        "| Apple | **Strong** [source: 1] |",
        "",
        "Summary paragraph",
      ].join("\n"),
    ),
  ).toEqual([
    {
      type: "table",
      headers: ["Company", "Note"],
      rows: [["Apple", "**Strong** [source: 1]"]],
      isPartialLastRow: false,
    },
    {
      type: "paragraph",
      text: "Summary paragraph",
    },
  ]);
});
```

- [ ] **Step 4: Run the parser tests to verify RED**

Run: `npm test -- lib/rag-assistant/message-content.test.ts`

Expected: FAIL because the parser does not yet emit `table` blocks.

### Task 2: Implement table parsing and message rendering

**Files:**
- Modify: `lib/rag-assistant/message-content.ts`
- Modify: `components/rag-assistant/chat/Message.tsx`

- [ ] **Step 1: Add a `table` block type to the parser**

Extend the `AssistantMarkdownBlock` union with a structured table shape.

```ts
  | {
      type: "table";
      headers: string[];
      rows: string[][];
      isPartialLastRow: boolean;
    };
```

- [ ] **Step 2: Implement table detection before paragraph fallback**

Teach the parser to detect `header -> delimiter -> body rows`, normalize cell counts, and mark the final row as partial when the streamed line does not close cleanly.

```ts
const table = collectTable(lines, index);
if (table) {
  blocks.push(table.block);
  index = table.nextIndex;
  continue;
}
```

- [ ] **Step 3: Render table blocks in the message component**

Add a `table` branch inside `renderAssistantBlock` and reuse `renderInlineTokens` for every cell.

```tsx
case "table":
  return (
    <div key={`${messageId}-${block.type}-${blockIndex}`} className="msg-table-wrap">
      <table className="msg-table">
        <thead>
          <tr>
            {block.headers.map((header, index) => (
              <th key={`${messageId}-head-${index}`} scope="col">
                {renderInlineTokens(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{/* rows */}</tbody>
      </table>
    </div>
  );
```

- [ ] **Step 4: Show the stream cursor inside the active table**

When the final rendered block is a table and the message is still streaming, append the cursor to the last available cell instead of outside the table.

```tsx
{showCursor && isLastCell ? <span className="stream-cursor" /> : null}
```

- [ ] **Step 5: Run the parser tests to verify GREEN**

Run: `npm test -- lib/rag-assistant/message-content.test.ts`

Expected: PASS for the new table coverage.

### Task 3: Add chat-native table styling and verify the integration

**Files:**
- Modify: `app/demos/rag-assistant/demo.css`
- Verify: `components/rag-assistant/chat/Message.tsx`
- Verify: `lib/rag-assistant/message-content.ts`

- [ ] **Step 1: Add table wrapper and cell styles**

Keep tables readable inside the chat column and allow horizontal scroll on narrow screens.

```css
.msg-table-wrap {
  overflow-x: auto;
}

.msg-table {
  width: 100%;
  min-width: 520px;
  border-collapse: collapse;
}
```

- [ ] **Step 2: Style header and body cells in the existing visual language**

Use the current border and color tokens so the table feels native to the demo.

```css
.msg-table th,
.msg-table td {
  padding: 10px 12px;
  border: 1px solid var(--border);
  vertical-align: top;
}
```

- [ ] **Step 3: Run the focused RAG message tests**

Run: `npm test -- lib/rag-assistant/message-content.test.ts`

Expected: PASS with the parser and rendering contract intact.

- [ ] **Step 4: Run the full project test suite**

Run: `npm test`

Expected: PASS for the full Vitest suite.

- [ ] **Step 5: Run the production build**

Run: `npm run build`

Expected: successful Next.js production build.
