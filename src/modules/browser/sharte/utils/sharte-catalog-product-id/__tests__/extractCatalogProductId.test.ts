import { describe, expect, it } from "vitest";
import { extractCatalogProductId } from "../extractCatalogProductId.js";

describe("extractCatalogProductId", () => {
  it("reads data-product-id from #catalogElement", () => {
    const html = `<div id="catalogElement" data-product-id="42"></div>`;
    expect(extractCatalogProductId(html)).toBe("42");
  });

  it("returns null when missing", () => {
    expect(extractCatalogProductId("<html></html>")).toBeNull();
  });
});
