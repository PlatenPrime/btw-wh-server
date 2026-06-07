import * as cheerio from "cheerio";
import { describe, expect, it } from "vitest";
import { parseStockFromDom } from "../yumiProductStockFromDom.js";
describe("parseStockFromDom", () => {
    it("returns 0 when out of stock (Ukrainian)", () => {
        const $ = cheerio.load(`<div data-qaid="product_status_sticky_panel" title="Немає в наявності"></div>`);
        expect(parseStockFromDom($)).toBe(0);
    });
    it("returns 0 when out of stock (Russian)", () => {
        const $ = cheerio.load(`<div data-qaid="product_status_sticky_panel">нет в наличии</div>`);
        expect(parseStockFromDom($)).toBe(0);
    });
    it("parses quantity from in-stock status text", () => {
        const $ = cheerio.load(`<div data-qaid="product_status_sticky_panel" title="В наявності: 42 шт"></div>`);
        expect(parseStockFromDom($)).toBe(42);
    });
    it("falls back to quantity_input max attribute", () => {
        const $ = cheerio.load(`<input name="quantity_input" max="15" />`);
        expect(parseStockFromDom($)).toBe(15);
    });
    it("returns 0 when no stock indicators found", () => {
        const $ = cheerio.load(`<div></div>`);
        expect(parseStockFromDom($)).toBe(0);
    });
});
