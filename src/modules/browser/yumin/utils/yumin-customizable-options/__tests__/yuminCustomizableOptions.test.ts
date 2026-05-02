import { describe, expect, it } from "vitest";
import { parseCustomizableOptions } from "../yuminCustomizableOptions.js";

describe("parseCustomizableOptions", () => {
  it("parses initial-price and flat-qty from Vue-like attrs", () => {
    const html = `<div v-product-customizable-options :initial-price="12.5" :flat-qty="10" />`;
    expect(parseCustomizableOptions(html)).toEqual({
      initialPrice: 12.5,
      flatQty: 10,
    });
  });

  it("returns null when attrs missing", () => {
    expect(parseCustomizableOptions("<html></html>")).toBeNull();
  });
});
