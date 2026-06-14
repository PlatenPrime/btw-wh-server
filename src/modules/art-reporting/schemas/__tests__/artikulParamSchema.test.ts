import { describe, expect, it } from "vitest";
import { artikulParamSchema } from "../artikulParamSchema.js";

describe("artikulParamSchema", () => {
  it("accepts non-empty trimmed artikul", () => {
    const r = artikulParamSchema.safeParse("  1302-0065  ");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("1302-0065");
  });

  it("rejects empty artikul", () => {
    expect(artikulParamSchema.safeParse("   ").success).toBe(false);
  });
});
