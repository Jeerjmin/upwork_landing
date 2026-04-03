# RAG Markdown Table Rendering Design

Date: 2026-04-03
Status: Approved for planning

## Context

The RAG assistant demo currently renders assistant messages through a small custom markdown parser in `lib/rag-assistant/message-content.ts` and a React renderer in `components/rag-assistant/chat/Message.tsx`.

Today the renderer supports:
- headings
- ordered and unordered lists
- horizontal rules
- paragraphs
- inline `**bold**`
- inline `[source: ...]` citations

Markdown tables are not supported, so valid model output such as:

```md
| Company | 2024 Revenue |
| --- | --- |
| Amazon | $637,959 million |
| Apple | $391,035 million |
```

is displayed as raw text instead of a structured table.

The desired outcome is to render standard markdown tables directly on the frontend, without changing the API contract, while preserving the current streaming UX.

## Goals

- Render standard pipe-based markdown tables as semantic HTML tables.
- Support table rendering during streaming, not only after the final message arrives.
- Keep the existing custom renderer and extend it incrementally instead of replacing it with a full markdown stack.
- Reuse existing inline formatting rules inside table cells.
- Preserve the current behavior for non-table content.

## Non-Goals

- Changing the backend response format to HTML or JSON.
- Replacing the current renderer with a third-party markdown library.
- Supporting every possible markdown edge case or GitHub Flavored Markdown feature beyond the table syntax needed by the product.
- Redesigning the overall chat UI outside the table presentation.

## Recommended Approach

Extend the current custom parser with a new `table` block type and render that block in the chat message component as a native HTML `<table>`.

This approach is preferred because it:
- avoids API changes
- avoids introducing markdown dependencies and sanitization concerns
- preserves full control over streaming behavior
- fits the existing architecture with minimal surface area

## Syntax Rules

The parser should treat content as a table only when all of the following are true:

1. A candidate header row exists and uses pipe-delimited cells.
2. The following non-empty line is a delimiter row made of dashes, optional colons, and pipes.
3. Zero or more subsequent pipe-delimited body rows follow.

Examples that should become tables:

```md
| Company | Revenue |
| --- | --- |
| Amazon | $637B |
```

```md
Company | Revenue
--- | ---
Amazon | $637B
```

Examples that should stay as plain text:

```md
Revenue | Margin
```

```md
Use the expression A | B in the formula.
```

This rule intentionally avoids guessing until the delimiter row appears. That gives predictable streaming behavior and prevents false positives.

## Data Model

Add a new parser block:

```ts
type AssistantMarkdownBlock =
  | { type: "heading"; ... }
  | { type: "list"; ... }
  | { type: "paragraph"; ... }
  | { type: "rule" }
  | {
      type: "table";
      headers: string[];
      rows: string[][];
      isPartialLastRow: boolean;
    };
```

Notes:
- `headers` contains the normalized header cells.
- `rows` contains normalized body rows.
- `isPartialLastRow` is `true` only when the currently streamed last row has started but is not yet complete.

## Parsing Design

The parser should continue operating on the full accumulated `message.content`, not on individual websocket chunks.

Parsing flow:

1. Normalize line endings and whitespace with the existing normalization step.
2. Scan lines from top to bottom.
3. Before falling back to paragraph parsing, attempt to detect a table start at the current line.
4. If a valid header row plus delimiter row is found, collect following table rows until the sequence breaks.
5. Emit a `table` block and continue parsing the next block.

### Header and delimiter detection

- Header rows may start and end with pipes, but that should not be mandatory.
- Delimiter cells must consist of at least three dashes, with optional leading or trailing colons for alignment markers.
- Alignment markers may be parsed but do not need to affect rendering in this version.

### Row normalization

To keep the UI resilient against imperfect model output:

- If a body row has fewer cells than the header count, pad the missing cells with empty strings.
- If a body row has more cells than the header count, merge the overflow content into the last cell.
- Trim outer whitespace around each cell.
- Preserve inline markdown markers inside cells for the renderer to process later.

### Streaming behavior

During streaming:

- A header line alone remains plain text.
- As soon as the delimiter row arrives, the parser should reinterpret the block as a table.
- Additional streamed rows should appear in the table immediately as they arrive.
- If the last row has started but is incomplete, it should still appear as the last rendered row with `isPartialLastRow: true`.

This implies a small visual reflow at the moment the delimiter row arrives. That reflow is acceptable and is the earliest reliable moment to identify a markdown table.

## Rendering Design

Update `components/rag-assistant/chat/Message.tsx` so that `renderAssistantBlock` supports the new `table` block type.

Recommended structure:

```tsx
<div className="msg-table-wrap">
  <table className="msg-table">
    <thead>
      <tr>...</tr>
    </thead>
    <tbody>
      <tr>...</tr>
    </tbody>
  </table>
</div>
```

Rendering rules:

- Render header cells as `<th scope="col">`.
- Render body cells as `<td>`.
- Reuse the existing inline token renderer inside every cell so `**bold**`, source cites, and line breaks continue to work.
- If the message is still streaming and the table block is the final block, show the stream cursor inside the last available cell of the last row.
- If the table has headers but no body rows yet, the cursor may be shown in the final header cell until the first body row begins.

## Visual Design

Add focused table styles to `app/demos/rag-assistant/demo.css`.

Requirements:

- horizontal scrolling on narrow screens via wrapper overflow
- full-width table inside the message area, but without forcing the whole chat column to overflow
- compact padding that matches the existing message typography
- subtle borders using the current panel and border tokens
- a slightly stronger background for the header row
- readable cell alignment for dense numeric content

Recommended CSS direction:

- `.msg-table-wrap { overflow-x: auto; }`
- `.msg-table { width: 100%; min-width: 520px; border-collapse: collapse; }`
- `.msg-table th, .msg-table td { padding: 10px 12px; border: 1px solid var(--border); vertical-align: top; }`
- `.msg-table th { font-family: var(--mono); font-size: 11px; color: #f8fafc; background: rgba(255,255,255,0.03); }`
- `.msg-table td { font-size: 13px; line-height: 1.6; }`

## Error Handling and Edge Cases

- Lines containing pipes without a valid delimiter row must remain paragraphs.
- A table followed by normal markdown content must terminate cleanly and allow the next block to render normally.
- Empty body cells should render as empty table cells, not collapse the layout.
- The parser should not throw on malformed rows; it should normalize and continue whenever possible.
- If streaming ends with a malformed final row, render the best-effort partial row rather than discarding it.

## Testing Strategy

Primary coverage should live in `lib/rag-assistant/message-content.test.ts`.

Required test cases:

- parses a complete markdown table into a `table` block
- keeps pipe-delimited text as a paragraph when no delimiter row exists
- reinterprets text into a table once the delimiter row appears
- parses a streamed partial last row and marks `isPartialLastRow`
- parses a table followed by a normal paragraph
- preserves inline bold markers and source citations inside cells
- normalizes short and long body rows against the header width

Component-level rendering tests are not required for the initial implementation. Parser tests are the primary guardrail because the renderer is intentionally thin.

## Prompt Guidance

No backend contract change is required, but prompt quality still matters. The assistant prompt should prefer valid markdown tables with an explicit delimiter row whenever tabular data is appropriate.

Recommended instruction:

```text
When presenting tabular data, output a valid markdown table with a header row and a delimiter row.
```

This prompt adjustment is outside the required implementation scope, but it is recommended for reliability.

## Implementation Scope

Files expected to change during implementation:

- `lib/rag-assistant/message-content.ts`
- `lib/rag-assistant/message-content.test.ts`
- `components/rag-assistant/chat/Message.tsx`
- `app/demos/rag-assistant/demo.css`

No API, websocket protocol, or type contract changes are required outside the local message rendering path.

## Risks

- The moment when the delimiter row arrives will cause already-rendered plain text to reflow into a table.
- Custom markdown parsing can accumulate edge cases over time if more syntax types are added without boundaries.
- Very wide tables may still require horizontal scroll on mobile, even with careful styling.

These risks are acceptable for the current scope and lower than the cost of switching to a full markdown rendering stack.
