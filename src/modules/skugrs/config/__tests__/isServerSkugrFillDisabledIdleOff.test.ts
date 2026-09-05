import { describe, expect, it, vi } from "vitest";

vi.mock("../../../browser/air/utils/airIdleMode.js", () => ({
  AIR_IDLE_MODE: false,
}));

import { isServerSkugrFillDisabled } from "../isServerSkugrFillDisabled.js";

describe("isServerSkugrFillDisabled (AIR_IDLE_MODE off)", () => {
  it("does not disable air when idle is off", () => {
    expect(isServerSkugrFillDisabled("air")).toBe(false);
    expect(isServerSkugrFillDisabled("balun")).toBe(false);
  });
});
