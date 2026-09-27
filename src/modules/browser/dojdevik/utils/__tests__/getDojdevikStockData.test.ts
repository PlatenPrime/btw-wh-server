import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDojdevikStockData } from "../getDojdevikStockData.js";
import { getBrowserAxios } from "../../../utils/browserRequest.js";
import {
  ADD_PRODUCT_TO_CART_QUERY,
  CART_CHANGE_PRODUCT_QUANTITY_QUERY,
  PROMUA_CART_PROBE_QUANTITY,
} from "../../../promua/cart/promUaCartGraphqlQueries.js";

vi.mock("../../../utils/browserRequest.js", () => ({
  getBrowserAxios: vi.fn(),
  logBrowserError: vi.fn(),
}));

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../sku-pages"
);

const PRODUCT_URL =
  "https://dojdevik.com.ua/ua/p17755382-vozdushnye-shary-prozrachnye.html";
const PRODUCT_ID = "17755382";
const CART_ID = "1104685463";

const ADD_SUCCESS = {
  data: {
    cartAddProduct: {
      __typename: "CartAddProductSuccess",
      self: {
        cartList: {
          carts: [
            {
              id: CART_ID,
              items: [
                {
                  productId: PRODUCT_ID,
                  price: { unit: { selling: "170.04" } },
                },
              ],
            },
          ],
        },
      },
    },
  },
};

const CHANGE_RECALCULATED = {
  data: {
    cartChangeProductQuantity: {
      __typename: "RequestedQuantityRecalculatedType",
      recalculatedReason: "EXCEEDS_AMOUNT_OF_PRODUCT_IN_STOCK",
      recalculatedQuantity: 35,
      self: {
        cartList: {
          cart: {
            items: [
              {
                productId: PRODUCT_ID,
                price: { unit: { selling: "170.04" } },
              },
            ],
          },
        },
      },
    },
  },
};

describe("getDojdevikStockData", () => {
  const mockGet = vi.fn();
  const mockPost = vi.fn();
  const skuPageHtml = readFileSync(join(fixturesDir, "sku-page.txt"), "utf8");

  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    vi.mocked(getBrowserAxios).mockReset();
    vi.mocked(getBrowserAxios).mockReturnValue({
      get: mockGet,
      post: mockPost,
    } as unknown as ReturnType<typeof getBrowserAxios>);
  });

  describe("Валидация входных данных", () => {
    it("должен выбрасывать ошибку при пустой ссылке", async () => {
      await expect(getDojdevikStockData("")).rejects.toThrow(
        "Link is required and must be a string"
      );
    });

    it("должен выбрасывать ошибку при пробельной ссылке", async () => {
      await expect(getDojdevikStockData("   ")).rejects.toThrow(
        "Link is required and must be a string"
      );
    });

    it("должен выбрасывать ошибку при не-строковом link", async () => {
      await expect(
        getDojdevikStockData(null as unknown as string)
      ).rejects.toThrow("Link is required and must be a string");
    });
  });

  it("returns per-piece price and piece stock from packs × packSize", async () => {
    mockGet.mockResolvedValueOnce({
      data: skuPageHtml,
      headers: {
        "set-cookie": ["csrf_token_company_site=cookie-csrf; Path=/"],
      },
    });
    mockPost
      .mockResolvedValueOnce({ status: 200, data: ADD_SUCCESS, headers: {} })
      .mockResolvedValueOnce({
        status: 200,
        data: CHANGE_RECALCULATED,
        headers: {},
      });

    const result = await getDojdevikStockData(PRODUCT_URL);

    expect(result.price).toBe(1.7);
    expect(result.stock).toBe(3500);
    expect(result.title).toContain("Повітряні кулі прозорі");
    expect(mockPost).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("dojdevik.com.ua/bfg/graphql"),
      expect.objectContaining({
        operationName: "AddProductToCart",
        query: ADD_PRODUCT_TO_CART_QUERY,
        variables: {
          payload: {
            productId: PRODUCT_ID,
            quantity: 1,
            source: "COMPANY_SITE",
          },
          viewerSource: "COMPANY_SITE",
        },
      }),
      expect.anything()
    );
    expect(mockPost).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("operation_name=CartChangeProductQuantity"),
      expect.objectContaining({
        operationName: "CartChangeProductQuantity",
        query: CART_CHANGE_PRODUCT_QUANTITY_QUERY,
        variables: {
          payload: {
            productId: PRODUCT_ID,
            quantity: PROMUA_CART_PROBE_QUANTITY,
            source: "COMPANY_SITE",
          },
          cartId: CART_ID,
          source: "COMPANY_SITE",
        },
      }),
      expect.anything()
    );
  });

  it("returns stock 0 when not orderable and HTML price exists", async () => {
    mockGet.mockResolvedValueOnce({
      data: skuPageHtml,
      headers: {},
    });
    mockPost.mockResolvedValueOnce({
      status: 200,
      data: {
        data: {
          cartAddProduct: { __typename: "ProductNotOrderableError" },
        },
      },
      headers: {},
    });

    const result = await getDojdevikStockData(PRODUCT_URL);
    expect(result.stock).toBe(0);
    expect(result.price).toBe(1.7);
    expect(result.title).toContain("Повітряні кулі прозорі");
  });

  it("returns -1 when productId is missing in URL", async () => {
    await expect(
      getDojdevikStockData("https://dojdevik.com.ua/ua/catalog")
    ).resolves.toEqual({ stock: -1, price: -1 });
    expect(getBrowserAxios).not.toHaveBeenCalled();
  });

  it("returns -1 when product page HTML is empty", async () => {
    mockGet.mockResolvedValueOnce({ data: "  ", headers: {} });
    await expect(getDojdevikStockData(PRODUCT_URL)).resolves.toEqual({
      stock: -1,
      price: -1,
    });
  });

  it("returns -1 when change qty is accepted without clamp", async () => {
    mockGet.mockResolvedValueOnce({ data: skuPageHtml, headers: {} });
    mockPost
      .mockResolvedValueOnce({ status: 200, data: ADD_SUCCESS, headers: {} })
      .mockResolvedValueOnce({
        status: 200,
        data: {
          data: {
            cartChangeProductQuantity: { __typename: "RequestedQuantitySet" },
          },
        },
        headers: {},
      });

    await expect(getDojdevikStockData(PRODUCT_URL)).resolves.toEqual({
      stock: -1,
      price: -1,
    });
  });

  it("returns -1 on network error", async () => {
    mockGet.mockRejectedValueOnce(new Error("Network error"));
    await expect(getDojdevikStockData(PRODUCT_URL)).resolves.toEqual({
      stock: -1,
      price: -1,
    });
  });

  it("falls back to GraphQL unit selling when HTML price is missing", async () => {
    mockGet.mockResolvedValueOnce({
      data: "<html>product without price</html>",
      headers: {},
    });
    mockPost
      .mockResolvedValueOnce({ status: 200, data: ADD_SUCCESS, headers: {} })
      .mockResolvedValueOnce({
        status: 200,
        data: CHANGE_RECALCULATED,
        headers: {},
      });

    await expect(getDojdevikStockData(PRODUCT_URL)).resolves.toEqual({
      stock: 35,
      price: 170.04,
    });
  });
});
