import { describe, expect, it } from "vitest";
import { isServerSkugrFillDisabled } from "../isServerSkugrFillDisabled.js";

describe("isServerSkugrFillDisabled (AIR_IDLE_MODE on)", () => {
  it("disables air regardless of casing", () => {
    expect(isServerSkugrFillDisabled("air")).toBe(true);
    expect(isServerSkugrFillDisabled("AIR")).toBe(true);
    expect(isServerSkugrFillDisabled(" Air ")).toBe(true);
  });

  it("does not disable other competitors", () => {
    expect(isServerSkugrFillDisabled("balun")).toBe(false);
    expect(isServerSkugrFillDisabled("yumi")).toBe(false);
    expect(isServerSkugrFillDisabled("")).toBe(false);
  });
});
