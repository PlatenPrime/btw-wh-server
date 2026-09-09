import { describe, expect, it } from "vitest";
import { extractProductDetailsHtmlFromRefreshResponse } from "../perfectRefreshResponse.js";

describe("extractProductDetailsHtmlFromRefreshResponse", () => {
  it("returns product_details HTML", () => {
    const html = '<div id="product-details" data-product="{}"></div>';
    expect(
      extractProductDetailsHtmlFromRefreshResponse(
        JSON.stringify({ product_details: html })
      )
    ).toBe(html);
  });

  it("returns null for empty product_details", () => {
    expect(
      extractProductDetailsHtmlFromRefreshResponse(
        JSON.stringify({ product_details: "  " })
      )
    ).toBeNull();
  });

  it("returns null for invalid json", () => {
    expect(extractProductDetailsHtmlFromRefreshResponse("<html>")).toBeNull();
  });
});
