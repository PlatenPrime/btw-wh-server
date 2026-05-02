import * as cheerio from "cheerio";
import { describe, expect, it } from "vitest";
import { parseSharikSearchCard } from "../parseSharikSearchCard.js";
describe("parseSharikSearchCard", () => {
    it("parses one-item card", () => {
        const html = `
      <div class="one-item">
        <div class="one-item-tit">Кулька</div>
        <div class="one-item-price">10 грн</div>
        <div class="one-item-quantity">У наявності: 5 шт</div>
      </div>`;
        const $ = cheerio.load(html);
        const el = $(".one-item").first();
        expect(parseSharikSearchCard("ART", el)).toEqual({
            nameukr: "Кулька",
            price: 10,
            quantity: 5,
        });
    });
});
