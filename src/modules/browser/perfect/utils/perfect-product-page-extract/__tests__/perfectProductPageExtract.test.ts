import { describe, expect, it } from "vitest";
import {
  extractProductId,
  extractTitle,
  extractToken,
} from "../perfectProductPageExtract.js";

describe("extractToken", () => {
  it("finds token in prestashop-style JSON", () => {
    const html = '{"token":"abc123abc123abc123","id_product":"1"}';
    expect(extractToken(html)).toBe("abc123abc123abc123");
  });

  it("finds token in token: form", () => {
    expect(extractToken('token: "fedcfedcfedcfedc1234"')).toBe("fedcfedcfedcfedc1234");
  });

  it("returns null when absent", () => {
    expect(extractToken("<html></html>")).toBeNull();
  });
});

describe("extractProductId", () => {
  it("prefers id from product URL", () => {
    expect(
      extractProductId(
        "{}",
        "https://perfectparty.in.ua/x/16467-product.html"
      )
    ).toBe("16467");
  });

  it("falls back to HTML patterns", () => {
    expect(extractProductId('{"id_product":"99"}', "")).toBe("99");
  });
});

describe("extractTitle", () => {
  it("prefers h1 over og:title", () => {
    const html = `
      <html><head><meta property="og:title" content="OG"></head>
      <body><h1>Real title</h1></body></html>`;
    expect(extractTitle(html)).toBe("Real title");
  });

  it("uses og:title when no h1", () => {
    const html = `<head><meta property="og:title" content="OG only"></head>`;
    expect(extractTitle(html)).toBe("OG only");
  });
});
