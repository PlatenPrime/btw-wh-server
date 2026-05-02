import * as cheerio from "cheerio";
import { describe, expect, it } from "vitest";
import { parseLdJsonProductName } from "../yuminLdJsonProductName.js";

describe("parseLdJsonProductName", () => {
  it("reads Product name from ld+json script", () => {
    const html = `
      <script type="application/ld+json">
        {"@type":"Product","name":"Test Product"}
      </script>`;
    const $ = cheerio.load(html);
    expect(parseLdJsonProductName($)).toBe("Test Product");
  });

  it("returns null when no Product script", () => {
    const $ = cheerio.load("<html></html>");
    expect(parseLdJsonProductName($)).toBeNull();
  });
});
