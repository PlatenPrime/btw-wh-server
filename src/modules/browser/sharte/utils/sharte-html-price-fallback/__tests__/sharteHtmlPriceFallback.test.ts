import { describe, expect, it } from "vitest";
import {
  parsePriceFromElement,
  stockInfoFromHtmlFallback,
} from "../sharteHtmlPriceFallback.js";

describe("parsePriceFromElement", () => {
  it("parses price with грн suffix", () => {
    expect(parsePriceFromElement("1,85 грн.")).toBe(1.85);
  });
});

describe("stockInfoFromHtmlFallback", () => {
  it("returns zero stock with parsed price", () => {
    const html = `<body><a class="price changePrice">10 грн</a></body>`;
    const r = stockInfoFromHtmlFallback(html, "1");
    expect(r.stock).toBe(0);
    expect(r.price).toBe(10);
  });
});
