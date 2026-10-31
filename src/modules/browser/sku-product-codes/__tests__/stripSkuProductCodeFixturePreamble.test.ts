import { describe, expect, it } from "vitest";
import { stripSkuProductCodeFixturePreamble } from "../stripSkuProductCodeFixturePreamble.js";

describe("stripSkuProductCodeFixturePreamble", () => {
  it("strips artikul annotation before doctype", () => {
    const raw = "artikul: SDR-120\n\n\n<!DOCTYPE html><html></html>";
    expect(stripSkuProductCodeFixturePreamble(raw)).toBe("<!DOCTYPE html><html></html>");
  });

  it("returns original when no html marker", () => {
    expect(stripSkuProductCodeFixturePreamble("artikul: x")).toBe("artikul: x");
  });
});
