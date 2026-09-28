import { describe, expect, it, vi } from "vitest";
import { resolvePerfectCartFailure } from "../resolvePerfectCartFailure.js";
import { PERFECT_UNAVAILABLE_OUTCOME } from "../../perfect-per-piece-stock/perfectProductInfo.js";

vi.mock("../../perfect-html-fallback/perfectHtmlFallback.js", () => ({
  tryPerfectHtmlFallback: vi.fn(() => null),
}));
vi.mock(
  "../../perfect-data-product-fallback/perfectDataProductFallback.js",
  () => ({
    tryPerfectDataProductFallback: vi.fn(() => null),
  })
);

import { tryPerfectHtmlFallback } from "../../perfect-html-fallback/perfectHtmlFallback.js";
import { tryPerfectDataProductFallback } from "../../perfect-data-product-fallback/perfectDataProductFallback.js";

describe("resolvePerfectCartFailure", () => {
  it("returns html fallback when present", () => {
    vi.mocked(tryPerfectHtmlFallback).mockReturnValueOnce({
      stock: 0,
      price: 1,
      source: "html-oos",
    });
    expect(resolvePerfectCartFailure("<html>", "T")).toEqual({
      stock: 0,
      price: 1,
      source: "html-oos",
    });
  });

  it("returns data-product fallback when html missing", () => {
    vi.mocked(tryPerfectHtmlFallback).mockReturnValueOnce(null);
    vi.mocked(tryPerfectDataProductFallback).mockReturnValueOnce({
      stock: 2,
      price: 3,
      source: "data-product",
    });
    expect(resolvePerfectCartFailure("<html>", "T")).toEqual({
      stock: 2,
      price: 3,
      source: "data-product",
    });
  });

  it("returns unavailable when both fallbacks miss", () => {
    vi.mocked(tryPerfectHtmlFallback).mockReturnValueOnce(null);
    vi.mocked(tryPerfectDataProductFallback).mockReturnValueOnce(null);
    expect(resolvePerfectCartFailure("<html>", "T")).toEqual(
      PERFECT_UNAVAILABLE_OUTCOME
    );
  });
});
