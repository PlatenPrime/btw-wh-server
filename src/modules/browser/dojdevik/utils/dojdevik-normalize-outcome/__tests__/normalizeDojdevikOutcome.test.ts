import { describe, expect, it } from "vitest";
import { DOJDEVIK_NEGATIVE_OUTCOME } from "../../dojdevik-product-types/dojdevikProductInfo.js";
import { normalizeDojdevikOutcome } from "../normalizeDojdevikOutcome.js";

describe("normalizeDojdevikOutcome", () => {
  it("converts packs and package price to per-piece outcome", () => {
    expect(normalizeDojdevikOutcome(50, 119, 70, "Ball")).toEqual({
      stock: 3500,
      price: 1.7,
      title: "Ball",
    });
  });

  it("omits title when empty", () => {
    expect(normalizeDojdevikOutcome(1, 10, 2, "")).toEqual({
      stock: 2,
      price: 5,
    });
  });

  it("returns negative outcome when package price is missing", () => {
    expect(normalizeDojdevikOutcome(10, undefined, 5, "x")).toEqual(
      DOJDEVIK_NEGATIVE_OUTCOME
    );
  });
});
