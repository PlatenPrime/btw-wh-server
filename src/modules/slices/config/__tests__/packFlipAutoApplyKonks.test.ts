import { describe, expect, it } from "vitest";
import { packFlipAutoApplyKonks } from "../packFlipAutoApplyKonks.js";

describe("packFlipAutoApplyKonks", () => {
  it("lists normalized competitor names for cron auto-apply", () => {
    expect(packFlipAutoApplyKonks).toEqual(["perfect"]);
    expect(packFlipAutoApplyKonks.every((name) => name === name.trim().toLowerCase())).toBe(
      true
    );
  });
});
