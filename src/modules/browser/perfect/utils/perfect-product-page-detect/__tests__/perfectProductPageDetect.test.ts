import { describe, expect, it } from "vitest";
import { isPerfectProductPageHtml } from "../perfectProductPageDetect.js";

describe("isPerfectProductPageHtml", () => {
  it("detects product page by data-product block", () => {
    const html = `<div id="product-details" data-product='{"quantity":5}'></div>`;
    expect(isPerfectProductPageHtml(html)).toBe(true);
  });

  it("detects product page by add-to-cart form", () => {
    expect(isPerfectProductPageHtml('<form id="add-to-cart-or-refresh"></form>')).toBe(
      true
    );
  });

  it("returns false for empty or unrelated HTML", () => {
    expect(isPerfectProductPageHtml("")).toBe(false);
    expect(isPerfectProductPageHtml("<html><body>error</body></html>")).toBe(false);
  });
});
