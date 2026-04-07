import { describe, expect, it } from "vitest";

import {
  normalizeAssistantMessageContent,
  parseAssistantMarkdown,
} from "./message-content";

describe("normalizeAssistantMessageContent", () => {
  it("collapses whitespace-only gaps between assistant paragraphs", () => {
    expect(
      normalizeAssistantMessageContent(
        "# Report\n \n## Financials\n\t\n### Apple\n \t \nRevenue",
      ),
    ).toBe("# Report\n\n## Financials\n\n### Apple\n\nRevenue");
  });

  it("preserves single line breaks inside a paragraph", () => {
    expect(
      normalizeAssistantMessageContent("Revenue\nMargin\n \n2024 outlook"),
    ).toBe("Revenue\nMargin\n\n2024 outlook");
  });

  it("removes trailing blank space that would create empty space while streaming", () => {
    expect(
      normalizeAssistantMessageContent("Answer in progress\n\nNext section\n \n \n"),
    ).toBe("Answer in progress\n\nNext section");
  });

  it("parses markdown headings, lists, and rules into structured blocks", () => {
    expect(
      parseAssistantMarkdown(
        [
          "# Revenue comparison",
          "",
          "## Apple",
          "- Revenue: $391B",
          "- Growth: 2%",
          "",
          "## Amazon",
          "1. Revenue: $638B",
          "2. Growth: 11%",
          "",
          "---",
          "",
          "Amazon leads by $247B",
        ].join("\n"),
      ),
    ).toEqual([
      {
        type: "heading",
        level: 1,
        text: "Revenue comparison",
      },
      {
        type: "heading",
        level: 2,
        text: "Apple",
      },
      {
        type: "list",
        ordered: false,
        items: ["Revenue: $391B", "Growth: 2%"],
      },
      {
        type: "heading",
        level: 2,
        text: "Amazon",
      },
      {
        type: "list",
        ordered: true,
        items: ["Revenue: $638B", "Growth: 11%"],
      },
      {
        type: "rule",
      },
      {
        type: "paragraph",
        text: "Amazon leads by $247B",
      },
    ]);
  });

  it("keeps multi-line paragraph content together", () => {
    expect(
      parseAssistantMarkdown("Revenue is stable\nacross both regions\n\nNew section"),
    ).toEqual([
      {
        type: "paragraph",
        text: "Revenue is stable\nacross both regions",
      },
      {
        type: "paragraph",
        text: "New section",
      },
    ]);
  });

  it("parses a complete markdown table into a table block", () => {
    expect(
      parseAssistantMarkdown(
        [
          "| Company | Revenue | Growth |",
          "| --- | --- | --- |",
          "| Amazon | $637B | 11% |",
          "| Apple | $391B | 2% |",
        ].join("\n"),
      ),
    ).toEqual([
      {
        type: "table",
        headers: ["Company", "Revenue", "Growth"],
        rows: [
          ["Amazon", "$637B", "11%"],
          ["Apple", "$391B", "2%"],
        ],
        isPartialLastRow: false,
      },
    ]);
  });

  it("keeps pipe-delimited text as a paragraph when no delimiter row exists", () => {
    expect(parseAssistantMarkdown("Revenue | Margin")).toEqual([
      {
        type: "paragraph",
        text: "Revenue | Margin",
      },
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

  it("parses a table followed by a paragraph and preserves inline markup", () => {
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

  it("normalizes body rows that do not match the header width", () => {
    expect(
      parseAssistantMarkdown(
        [
          "| Company | Revenue | Growth |",
          "| --- | --- | --- |",
          "| Amazon | $637B |",
          "| Apple | $391B | 2% | Services |",
        ].join("\n"),
      ),
    ).toEqual([
      {
        type: "table",
        headers: ["Company", "Revenue", "Growth"],
        rows: [
          ["Amazon", "$637B", ""],
          ["Apple", "$391B", "2% | Services"],
        ],
        isPartialLastRow: false,
      },
    ]);
  });
});
