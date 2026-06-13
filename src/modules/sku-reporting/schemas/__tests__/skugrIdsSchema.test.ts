import { describe, expect, it } from "vitest";
import { skugrIdsSchema } from "../skugrIdsSchema.js";

const VALID_ID = "507f1f77bcf86cd799439011";
const VALID_ID_2 = "507f1f77bcf86cd799439012";

describe("skugrIdsSchema", () => {
  it("returns undefined for empty or missing input", () => {
    expect(skugrIdsSchema.safeParse(undefined).success).toBe(true);
    expect(skugrIdsSchema.safeParse("").success).toBe(true);
    expect(skugrIdsSchema.safeParse(null).success).toBe(true);
  });

  it("parses CSV string into unique ObjectId array", () => {
    const result = skugrIdsSchema.safeParse(`${VALID_ID}, ${VALID_ID_2},${VALID_ID}`);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual([VALID_ID, VALID_ID_2]);
  });

  it("parses array query values", () => {
    const result = skugrIdsSchema.safeParse([VALID_ID, VALID_ID_2]);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual([VALID_ID, VALID_ID_2]);
  });

  it("rejects invalid ObjectId values", () => {
    const result = skugrIdsSchema.safeParse("not-an-object-id");
    expect(result.success).toBe(false);
  });
});
