import { describe, expect, it } from "vitest";

import { formatAgentTraceDocuments, formatAgentTraceLabel } from "./trace";

describe("formatAgentTraceLabel", () => {
  it("formats comparison traces with the iteration number", () => {
    expect(
      formatAgentTraceLabel({
        iteration: 2,
        query: "Microsoft AI investment",
        focus: "comparison",
        rationale: "Gather Microsoft evidence",
        status: "completed",
      }),
    ).toBe("Searching 2: Microsoft AI investment");
  });
});

describe("formatAgentTraceDocuments", () => {
  it("joins the top two documents into a compact summary", () => {
    expect(
      formatAgentTraceDocuments({
        iteration: 1,
        query: "Apple AI investment",
        focus: "comparison",
        rationale: "Gather Apple evidence",
        status: "completed",
        topDocuments: [
          "Apple-2024-Annual-Report.pdf",
          "Apple-Q3-2024-Earnings.pdf",
          "Ignored.pdf",
        ],
      }),
    ).toBe("Apple-2024-Annual-Report.pdf • Apple-Q3-2024-Earnings.pdf");
  });
});
