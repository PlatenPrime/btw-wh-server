import { describe, expect, it } from "vitest";
import { BALUN_NEGATIVE_OUTCOME } from "../../balun-product-types/balunProductInfo.js";
import { normalizeBalunOutcome } from "../normalizeBalunOutcome.js";

describe("normalizeBalunOutcome", () => {
  it("returns stock and price when price is defined", () => {
    expect(normalizeBalunOutcome(371, 1.46)).toEqual({
      stock: 371,
      price: 1.46,
    });
    expect(normalizeBalunOutcome(0, 1.46)).toEqual({ stock: 0, price: 1.46 });
  });

  it("returns negative outcome when price is missing", () => {
    expect(normalizeBalunOutcome(10, undefined)).toEqual(BALUN_NEGATIVE_OUTCOME);
  });
});
