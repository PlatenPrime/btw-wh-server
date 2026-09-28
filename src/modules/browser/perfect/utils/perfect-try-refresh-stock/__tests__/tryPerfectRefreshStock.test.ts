import { describe, expect, it, vi } from "vitest";
import type { AxiosInstance } from "axios";
import { tryPerfectRefreshStock } from "../tryPerfectRefreshStock.js";

vi.mock("../../../utils/browserRequest.js", () => ({
  logBrowserError: vi.fn(),
}));
vi.mock("../../perfect-ajax-post/perfectAjaxPost.js", () => ({
  postPerfectAjax: vi.fn(),
}));
vi.mock("../../perfect-refresh-response/perfectRefreshResponse.js", () => ({
  extractProductDetailsHtmlFromRefreshResponse: vi.fn(),
}));
vi.mock(
  "../../perfect-data-product-fallback/perfectDataProductFallback.js",
  () => ({
    tryPerfectDataProductFallback: vi.fn(),
  })
);

import { postPerfectAjax } from "../../perfect-ajax-post/perfectAjaxPost.js";
import { extractProductDetailsHtmlFromRefreshResponse } from "../../perfect-refresh-response/perfectRefreshResponse.js";
import { tryPerfectDataProductFallback } from "../../perfect-data-product-fallback/perfectDataProductFallback.js";

describe("tryPerfectRefreshStock", () => {
  const client = {} as AxiosInstance;

  it("returns null info when status >= 400", async () => {
    vi.mocked(postPerfectAjax).mockResolvedValueOnce({
      status: 500,
      data: "",
      cookieHeader: "c=1",
    });
    const result = await tryPerfectRefreshStock(
      client,
      "https://x/p",
      "T",
      "body",
      "c=0"
    );
    expect(result).toEqual({ info: null, cookieHeader: "c=1" });
  });

  it("returns refresh source when data-product fallback hits", async () => {
    vi.mocked(postPerfectAjax).mockResolvedValueOnce({
      status: 200,
      data: "{}",
      cookieHeader: "c=2",
    });
    vi.mocked(extractProductDetailsHtmlFromRefreshResponse).mockReturnValueOnce(
      "<div>"
    );
    vi.mocked(tryPerfectDataProductFallback).mockReturnValueOnce({
      stock: 5,
      price: 1.2,
      source: "data-product",
    });

    const result = await tryPerfectRefreshStock(
      client,
      "https://x/p",
      "T",
      "body",
      "c=0"
    );
    expect(result).toEqual({
      info: { stock: 5, price: 1.2, source: "refresh" },
      cookieHeader: "c=2",
    });
  });

  it("returns null info when details HTML missing", async () => {
    vi.mocked(postPerfectAjax).mockResolvedValueOnce({
      status: 200,
      data: "{}",
      cookieHeader: "c=3",
    });
    vi.mocked(extractProductDetailsHtmlFromRefreshResponse).mockReturnValueOnce(
      null
    );
    const result = await tryPerfectRefreshStock(
      client,
      "https://x/p",
      "T",
      "body",
      "c=0"
    );
    expect(result).toEqual({ info: null, cookieHeader: "c=3" });
  });
});
