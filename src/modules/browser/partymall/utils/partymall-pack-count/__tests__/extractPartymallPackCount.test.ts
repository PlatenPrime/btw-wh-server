import * as cheerio from "cheerio";
import { describe, expect, it } from "vitest";
import { extractPartymallPackCount } from "../extractPartymallPackCount.js";

describe("extractPartymallPackCount", () => {
  it("reads pack count from attributes item", () => {
    const $ = cheerio.load(`<html><body>
      <div class="ds-product-attributes-item">
        <div class="secondary-text"><span>Кількість в упаковці.</span></div>
        <span class="fw-500">100</span>
      </div>
    </body></html>`);
    expect(extractPartymallPackCount($)).toBe(100);
  });

  it("returns null when pack attribute is missing", () => {
    const $ = cheerio.load(`<html><body>
      <div class="ds-product-attributes-item">
        <div class="secondary-text"><span>Колір</span></div>
        <span class="fw-500">Білий</span>
      </div>
      <h1>Палички (50 шт.)</h1>
    </body></html>`);
    expect(extractPartymallPackCount($)).toBeNull();
  });

  it("returns null for empty attributes", () => {
    const $ = cheerio.load("<html><body></body></html>");
    expect(extractPartymallPackCount($)).toBeNull();
  });
});
