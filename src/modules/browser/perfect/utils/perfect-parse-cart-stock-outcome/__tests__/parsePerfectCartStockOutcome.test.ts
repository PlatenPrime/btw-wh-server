import { describe, expect, it, vi } from "vitest";
import { parsePerfectCartStockOutcome } from "../parsePerfectCartStockOutcome.js";
import { PERFECT_UNAVAILABLE_OUTCOME } from "../../perfect-per-piece-stock/perfectProductInfo.js";

vi.mock("../../perfect-cart-response/perfectCartResponse.js", () => ({
  parseCartResponse: vi.fn(),
  parsePackPrice: vi.fn(),
  resolvePerfectCartDeleteIds: vi.fn(
    (
      _product: unknown,
      fallback: { idProduct: string; idProductAttribute: string | null; idCustomization: string }
    ) => fallback
  ),
}));
vi.mock("../../perfect-resolve-cart-failure/resolvePerfectCartFailure.js", () => ({
  resolvePerfectCartFailure: vi.fn(() => ({
    stock: 0,
    price: 1,
    source: "html-oos",
  })),
}));
vi.mock("../../perfect-per-piece-stock/perfectPerPieceStock.js", () => ({
  toStockAndPrice: vi.fn((stock: number, price: number, title: string) => ({
    stock,
    price,
    title,
  })),
}));
vi.mock("../../parse-number-like/parseNumberLike.js", () => ({
  parseNumberLike: vi.fn(),
}));
vi.mock("../../perfect-log-unavailable/logPerfectUnavailableOutcome.js", () => ({
  logPerfectUnavailableOutcome: vi.fn(),
}));

import {
  parseCartResponse,
  parsePackPrice,
} from "../../perfect-cart-response/perfectCartResponse.js";
import { parseNumberLike } from "../../parse-number-like/parseNumberLike.js";
import { resolvePerfectCartFailure } from "../../perfect-resolve-cart-failure/resolvePerfectCartFailure.js";

const fallbackIds = {
  idProduct: "1",
  idProductAttribute: null as string | null,
  idCustomization: "0",
};

describe("parsePerfectCartStockOutcome", () => {
  it("uses cart failure when product missing", () => {
    vi.mocked(parseCartResponse).mockReturnValueOnce({ cart: { products: [] } });
    const result = parsePerfectCartStockOutcome(
      "{}",
      "<html>",
      "Title",
      fallbackIds,
      200,
      true,
      "https://x/p"
    );
    expect(result.outcome).toEqual({
      stock: 0,
      price: 1,
      source: "html-oos",
    });
    expect(resolvePerfectCartFailure).toHaveBeenCalled();
  });

  it("returns cart source on valid product", () => {
    vi.mocked(parseCartResponse).mockReturnValueOnce({
      cart: {
        products: [
          {
            id_product: "1",
            stock_quantity: "10",
            name: "Ball",
          },
        ],
      },
    });
    vi.mocked(parseNumberLike).mockReturnValueOnce(10);
    vi.mocked(parsePackPrice).mockReturnValueOnce(5);

    const result = parsePerfectCartStockOutcome(
      "{}",
      "<html>",
      "Page",
      fallbackIds,
      200,
      true,
      "https://x/p"
    );
    expect(result.outcome).toEqual({
      stock: 10,
      price: 5,
      title: "Ball",
      source: "cart",
    });
  });

  it("returns unavailable on invalid stock", () => {
    vi.mocked(parseCartResponse).mockReturnValueOnce({
      cart: {
        products: [{ id_product: "1", stock_quantity: "-1" }],
      },
    });
    vi.mocked(parseNumberLike).mockReturnValueOnce(-1);
    vi.mocked(parsePackPrice).mockReturnValueOnce(5);

    const result = parsePerfectCartStockOutcome(
      "{}",
      "<html>",
      "Page",
      fallbackIds,
      200,
      true,
      "https://x/p"
    );
    expect(result.outcome).toEqual(PERFECT_UNAVAILABLE_OUTCOME);
  });
});
