import * as cheerio from "cheerio";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  parseDojdevikPackagePriceFromDom,
  parseDojdevikTitleFromDom,
} from "../parseDojdevikPackagePriceFromDom.js";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../sku-pages"
);

describe("parseDojdevikPackagePriceFromDom", () => {
  it("reads package price from sku-page fixture", () => {
    const html = readFileSync(join(fixturesDir, "sku-page.txt"), "utf8");
    const $ = cheerio.load(html);
    expect(parseDojdevikPackagePriceFromDom($)).toBe(170.04);
    expect(parseDojdevikTitleFromDom($)).toContain("Повітряні кулі прозорі");
  });

  it("reads sale price from sku-page-sale fixture", () => {
    const html = readFileSync(join(fixturesDir, "sku-page-sale.txt"), "utf8");
    const $ = cheerio.load(html);
    expect(parseDojdevikPackagePriceFromDom($)).toBe(5.28);
  });

  it("prefers data-qaprice attr over text", () => {
    const $ = cheerio.load(
      `<span data-qaid="product_price" data-qaprice="12.5">999</span>`
    );
    expect(parseDojdevikPackagePriceFromDom($)).toBe(12.5);
  });

  it("returns null when price node is missing", () => {
    const $ = cheerio.load("<div></div>");
    expect(parseDojdevikPackagePriceFromDom($)).toBeNull();
  });
});
