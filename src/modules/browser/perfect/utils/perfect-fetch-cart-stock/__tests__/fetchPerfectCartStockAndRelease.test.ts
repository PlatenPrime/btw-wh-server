import { describe, expect, it, vi } from "vitest";
import type { AxiosInstance } from "axios";
import { fetchPerfectCartStockAndRelease } from "../fetchPerfectCartStockAndRelease.js";

vi.mock("../../perfect-ajax-post/perfectAjaxPost.js", () => ({
  PERFECT_CART_URL: "https://perfectparty.in.ua/cart",
  postPerfectAjax: vi.fn(),
}));
vi.mock("../../perfect-cart-delete/deletePerfectCartItem.js", () => ({
  deletePerfectCartItem: vi.fn().mockResolvedValue(undefined),
}));
vi.mock(
  "../../perfect-product-page-extract/perfectProductPageExtract.js",
  () => ({
    buildPerfectAddToCartBody: vi.fn(() => "add-body"),
  })
);
vi.mock(
  "../../perfect-parse-cart-stock-outcome/parsePerfectCartStockOutcome.js",
  () => ({
    parsePerfectCartStockOutcome: vi.fn(),
  })
);
vi.mock("../../perfect-resolve-cart-failure/resolvePerfectCartFailure.js", () => ({
  resolvePerfectCartFailure: vi.fn(() => ({
    stock: 0,
    price: 1,
    source: "html-oos",
  })),
}));

import { postPerfectAjax } from "../../perfect-ajax-post/perfectAjaxPost.js";
import { deletePerfectCartItem } from "../../perfect-cart-delete/deletePerfectCartItem.js";
import { parsePerfectCartStockOutcome } from "../../perfect-parse-cart-stock-outcome/parsePerfectCartStockOutcome.js";

describe("fetchPerfectCartStockAndRelease", () => {
  const client = {} as AxiosInstance;
  const params = {
    productUrl: "https://x/p",
    html: "<html>",
    pageTitle: "T",
    token: "tok",
    idProduct: "1",
    idProductAttribute: null as string | null,
    groupSelections: {},
    cookieHeader: "c=1",
    htmlStatus: 200,
    hasProductPageHtml: true,
  };

  it("parses cart outcome and always deletes cart item", async () => {
    vi.mocked(postPerfectAjax).mockResolvedValueOnce({
      status: 200,
      data: "{}",
      cookieHeader: "c=2",
    });
    vi.mocked(parsePerfectCartStockOutcome).mockReturnValueOnce({
      outcome: { stock: 3, price: 4, source: "cart" },
      deleteIds: {
        idProduct: "1",
        idProductAttribute: null,
        idCustomization: "0",
      },
    });

    const result = await fetchPerfectCartStockAndRelease(client, params);
    expect(result).toEqual({ stock: 3, price: 4, source: "cart" });
    expect(deletePerfectCartItem).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        token: "tok",
        cookieHeader: "c=2",
        productUrl: "https://x/p",
      })
    );
  });

  it("uses cart failure on HTTP error and still deletes", async () => {
    vi.mocked(postPerfectAjax).mockResolvedValueOnce({
      status: 500,
      data: "",
      cookieHeader: "c=3",
    });

    const result = await fetchPerfectCartStockAndRelease(client, params);
    expect(result).toEqual({ stock: 0, price: 1, source: "html-oos" });
    expect(deletePerfectCartItem).toHaveBeenCalled();
  });
});
