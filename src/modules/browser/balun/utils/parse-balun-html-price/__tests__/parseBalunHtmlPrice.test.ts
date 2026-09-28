import { describe, expect, it } from "vitest";
import { parseBalunHtmlPrice } from "../parseBalunHtmlPrice.js";

const HTML_WITH_PRICE = `
  <div data-analytics='{"clerk":{"price_original":"1.46"}}'></div>
`;
const HTML_WITH_COMMA_PRICE = `
  <div data-analytics='{"clerk":{"price_original":"12,34"}}'></div>
`;

describe("parseBalunHtmlPrice", () => {
  it("reads clerk.price_original", () => {
    expect(parseBalunHtmlPrice(HTML_WITH_PRICE)).toBe(1.46);
  });

  it("parses comma decimals", () => {
    expect(parseBalunHtmlPrice(HTML_WITH_COMMA_PRICE)).toBe(12.34);
  });

  it("returns undefined when analytics/price is missing or invalid", () => {
    expect(parseBalunHtmlPrice("<div></div>")).toBeUndefined();
    expect(
      parseBalunHtmlPrice(`<div data-analytics='{"clerk":{}}'></div>`)
    ).toBeUndefined();
    expect(
      parseBalunHtmlPrice(
        `<div data-analytics='{"clerk":{"price_original":""}}'></div>`
      )
    ).toBeUndefined();
    expect(
      parseBalunHtmlPrice(
        `<div data-analytics='{"clerk":{"price_original":"abc"}}'></div>`
      )
    ).toBeUndefined();
  });
});
