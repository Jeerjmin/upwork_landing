import { describe, expect, it } from "vitest";

import {
  FOLLOW_BOTTOM_THRESHOLD_PX,
  getDistanceToBottom,
  isNearBottom,
} from "./scroll";

describe("getDistanceToBottom", () => {
  it("returns zero when content fits fully in the viewport", () => {
    expect(
      getDistanceToBottom({
        scrollTop: 0,
        clientHeight: 600,
        scrollHeight: 480,
      }),
    ).toBe(0);
  });
});

describe("isNearBottom", () => {
  it("treats the viewport as following when it is within the threshold", () => {
    expect(
      isNearBottom({
        scrollTop: 804,
        clientHeight: 200,
        scrollHeight: 1100,
      }),
    ).toBe(true);
  });

  it("treats the viewport as not following once it moves beyond the threshold", () => {
    expect(
      isNearBottom({
        scrollTop: 803,
        clientHeight: 200,
        scrollHeight: 1100,
      }),
    ).toBe(false);
  });

  it("exports the approved follow threshold", () => {
    expect(FOLLOW_BOTTOM_THRESHOLD_PX).toBe(96);
  });
});
