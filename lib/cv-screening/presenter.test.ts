import { describe, expect, it } from "vitest";

import { formatExperienceLabel } from "./presenter";

describe("formatExperienceLabel", () => {
  it("joins years and focus into the compact experience label", () => {
    expect(
      formatExperienceLabel({
        years: "7+",
        focus: "backend & AI systems",
      }),
    ).toBe("7+ · backend & AI systems");
  });

  it("gracefully handles partial experience payloads during streaming", () => {
    expect(
      formatExperienceLabel({
        years: "7+",
      }),
    ).toBe("7+");

    expect(
      formatExperienceLabel({
        focus: "backend & AI systems",
      }),
    ).toBe("backend & AI systems");
  });
});
