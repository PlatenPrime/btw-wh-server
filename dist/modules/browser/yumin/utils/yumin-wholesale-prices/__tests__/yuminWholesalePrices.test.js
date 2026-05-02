import { describe, expect, it } from "vitest";
import { parseWholesalePrices } from "../yuminWholesalePrices.js";
describe("parseWholesalePrices", () => {
    it("collects prices from wholesale blocks", () => {
        const html = `
      <p>Від 10 шт.</p><p>15,50 грн</p>
      <p>Від 50 шт.</p><p>12 грн</p>
    `;
        expect(parseWholesalePrices(html)).toEqual([15.5, 12]);
    });
});
