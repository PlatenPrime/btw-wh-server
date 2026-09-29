import { describe, expect, it } from "vitest";
import { runSkugrSlicesTodaySchema } from "../runSkugrSlicesTodaySchema.js";

describe("runSkugrSlicesTodaySchema", () => {
  it("parses valid ObjectId", () => {
    const result = runSkugrSlicesTodaySchema.safeParse({
      skugrId: "507f1f77bcf86cd799439011",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid skugrId", () => {
    expect(
      runSkugrSlicesTodaySchema.safeParse({ skugrId: "bad" }).success
    ).toBe(false);
  });
});
