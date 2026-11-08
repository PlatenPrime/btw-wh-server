import { describe, expect, it } from "vitest";
import { createSkuStockBandSchema } from "../createSkuStockBandSchema.js";

describe("createSkuStockBandSchema", () => {
  it("normalizes konkName and accepts bounds", () => {
    const parsed = createSkuStockBandSchema.safeParse({
      konkName: " BALUN ",
      stockMin: 9500,
      stockMax: 10500,
      normalMax: 500,
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.konkName).toBe("balun");
  });

  it("rejects normalMax >= stockMin", () => {
    const parsed = createSkuStockBandSchema.safeParse({
      konkName: "balun",
      stockMin: 9500,
      stockMax: 10500,
      normalMax: 9500,
    });
    expect(parsed.success).toBe(false);
  });
});
