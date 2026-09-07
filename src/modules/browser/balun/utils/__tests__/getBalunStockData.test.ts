import { beforeEach, describe, expect, it, vi } from "vitest";
import { getBalunStockData, parseBalunHtmlPrice } from "../getBalunStockData.js";
import { getBrowserAxios } from "../../../utils/browserRequest.js";
import {
  ADD_PRODUCT_TO_CART_QUERY,
  BALUN_PROBE_QUANTITY,
  CART_CHANGE_PRODUCT_QUANTITY_QUERY,
} from "../balun-graphql/balunGraphqlQueries.js";

vi.mock("../../../utils/browserRequest.js", () => ({
  getBrowserAxios: vi.fn(),
  logBrowserError: vi.fn(),
}));

const PRODUCT_URL =
  "https://balun.com.ua/ua/p1341824038-folgirovannaya-sharik-zvezda.html";
const PRODUCT_ID = "1341824038";
const CART_ID = "1094691970";
const HTML_WITH_PRICE = `
  <div data-analytics='{"clerk":{"price_original":"1.46"}}'></div>
`;
const HTML_WITH_COMMA_PRICE = `
  <div data-analytics='{"clerk":{"price_original":"12,34"}}'></div>
`;

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
                  price: { unit: { selling: "1.46" } },
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
      recalculatedQuantity: 371,
      self: {
        cartList: {
          cart: {
            items: [
              {
                productId: PRODUCT_ID,
                price: { unit: { selling: "1.46" } },
              },
            ],
          },
        },
      },
    },
  },
};

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
        `<div data-analytics='{"clerk":{"price_original":"немає"}}'></div>`
      )
    ).toBeUndefined();
  });
});

describe("getBalunStockData", () => {
  const mockGet = vi.fn();
  const mockPost = vi.fn();

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
      await expect(getBalunStockData("")).rejects.toThrow(
        "Link is required and must be a string"
      );
    });

    it("должен выбрасывать ошибку при пробельной ссылке", async () => {
      await expect(getBalunStockData("   ")).rejects.toThrow(
        "Link is required and must be a string"
      );
    });

    it("должен выбрасывать ошибку при null", async () => {
      await expect(
        getBalunStockData(null as unknown as string)
      ).rejects.toThrow("Link is required and must be a string");
    });

    it("должен выбрасывать ошибку при undefined", async () => {
      await expect(
        getBalunStockData(undefined as unknown as string)
      ).rejects.toThrow("Link is required and must be a string");
    });

    it("должен выбрасывать ошибку при не-строковом link", async () => {
      await expect(getBalunStockData(123 as unknown as string)).rejects.toThrow(
        "Link is required and must be a string"
      );
    });
  });

  it("returns stock from recalculatedQuantity and HTML price", async () => {
    mockGet.mockResolvedValueOnce({
      data: HTML_WITH_PRICE,
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

    const result = await getBalunStockData(PRODUCT_URL);

    expect(result).toEqual({ stock: 371, price: 1.46 });
    expect(mockPost).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("operation_name=AddProductToCart"),
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
      expect.objectContaining({
        headers: expect.objectContaining({
          Cookie: expect.stringContaining("csrf_token_company_site=cookie-csrf"),
          "x-csrftoken": "cookie-csrf",
        }),
      })
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
            quantity: BALUN_PROBE_QUANTITY,
            source: "COMPANY_SITE",
          },
          cartId: CART_ID,
          source: "COMPANY_SITE",
        },
      }),
      expect.anything()
    );
  });

  it("prefers HTML csrf token over cookie", async () => {
    mockGet.mockResolvedValueOnce({
      data: `${HTML_WITH_PRICE}<meta name="csrf-token" content="html-csrf">`,
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

    await getBalunStockData(PRODUCT_URL);

    expect(mockPost.mock.calls[0]?.[2]?.headers).toEqual(
      expect.objectContaining({ "x-csrftoken": "html-csrf" })
    );
  });

  it("falls back to GraphQL unit selling when HTML price is missing", async () => {
    mockGet.mockResolvedValueOnce({
      data: "<html>product</html>",
      headers: {},
    });
    mockPost
      .mockResolvedValueOnce({ status: 200, data: ADD_SUCCESS, headers: {} })
      .mockResolvedValueOnce({
        status: 200,
        data: CHANGE_RECALCULATED,
        headers: {},
      });

    await expect(getBalunStockData(PRODUCT_URL)).resolves.toEqual({
      stock: 371,
      price: 1.46,
    });
  });

  it("returns -1 when productId is missing in URL", async () => {
    await expect(
      getBalunStockData("https://balun.com.ua/ua/catalog")
    ).resolves.toEqual({ stock: -1, price: -1 });
    expect(getBrowserAxios).not.toHaveBeenCalled();
  });

  it("returns -1 when product page HTML is empty", async () => {
    mockGet.mockResolvedValueOnce({ data: "  ", headers: {} });
    await expect(getBalunStockData(PRODUCT_URL)).resolves.toEqual({
      stock: -1,
      price: -1,
    });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("returns stock 0 when add says not orderable and HTML price exists", async () => {
    mockGet.mockResolvedValueOnce({
      data: HTML_WITH_PRICE,
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

    await expect(getBalunStockData(PRODUCT_URL)).resolves.toEqual({
      stock: 0,
      price: 1.46,
    });
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it("returns -1 when add says not orderable without a price", async () => {
    mockGet.mockResolvedValueOnce({
      data: "<html>product</html>",
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

    await expect(getBalunStockData(PRODUCT_URL)).resolves.toEqual({
      stock: -1,
      price: -1,
    });
  });

  it("returns -1 on AuthenticationError", async () => {
    mockGet.mockResolvedValueOnce({
      data: HTML_WITH_PRICE,
      headers: {},
    });
    mockPost.mockResolvedValueOnce({
      status: 200,
      data: {
        data: { cartAddProduct: { __typename: "AuthenticationError" } },
      },
      headers: {},
    });

    await expect(getBalunStockData(PRODUCT_URL)).resolves.toEqual({
      stock: -1,
      price: -1,
    });
  });

  it("returns -1 when change qty is accepted without clamp", async () => {
    mockGet.mockResolvedValueOnce({
      data: HTML_WITH_PRICE,
      headers: {},
    });
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

    await expect(getBalunStockData(PRODUCT_URL)).resolves.toEqual({
      stock: -1,
      price: -1,
    });
  });

  it("returns -1 when add HTTP status is 4xx", async () => {
    mockGet.mockResolvedValueOnce({
      data: HTML_WITH_PRICE,
      headers: {},
    });
    mockPost.mockResolvedValueOnce({
      status: 403,
      data: {},
      headers: {},
    });

    await expect(getBalunStockData(PRODUCT_URL)).resolves.toEqual({
      stock: -1,
      price: -1,
    });
  });

  it("returns -1 when change HTTP status is 4xx", async () => {
    mockGet.mockResolvedValueOnce({
      data: HTML_WITH_PRICE,
      headers: {},
    });
    mockPost
      .mockResolvedValueOnce({ status: 200, data: ADD_SUCCESS, headers: {} })
      .mockResolvedValueOnce({ status: 500, data: {}, headers: {} });

    await expect(getBalunStockData(PRODUCT_URL)).resolves.toEqual({
      stock: -1,
      price: -1,
    });
  });

  it("returns -1 when recalculated but no price from HTML or GraphQL", async () => {
    mockGet.mockResolvedValueOnce({
      data: "<html>product</html>",
      headers: {},
    });
    mockPost
      .mockResolvedValueOnce({
        status: 200,
        data: {
          data: {
            cartAddProduct: {
              __typename: "CartAddProductSuccess",
              self: { cartList: { carts: [{ id: CART_ID, items: [] }] } },
            },
          },
        },
        headers: {},
      })
      .mockResolvedValueOnce({
        status: 200,
        data: {
          data: {
            cartChangeProductQuantity: {
              __typename: "RequestedQuantityRecalculatedType",
              recalculatedReason: "EXCEEDS_AMOUNT_OF_PRODUCT_IN_STOCK",
              recalculatedQuantity: 371,
            },
          },
        },
        headers: {},
      });

    await expect(getBalunStockData(PRODUCT_URL)).resolves.toEqual({
      stock: -1,
      price: -1,
    });
  });

  it("returns -1 on network error", async () => {
    mockGet.mockRejectedValueOnce(new Error("Network error"));
    await expect(getBalunStockData(PRODUCT_URL)).resolves.toEqual({
      stock: -1,
      price: -1,
    });
  });

  it("omits x-csrftoken when HTML and cookie have no token", async () => {
    mockGet.mockResolvedValueOnce({
      data: HTML_WITH_PRICE,
      headers: { "set-cookie": ["cid=1; Path=/"] },
    });
    mockPost
      .mockResolvedValueOnce({ status: 200, data: ADD_SUCCESS, headers: {} })
      .mockResolvedValueOnce({
        status: 200,
        data: CHANGE_RECALCULATED,
        headers: {},
      });

    await getBalunStockData(PRODUCT_URL);

    const headers = mockPost.mock.calls[0]?.[2]?.headers as Record<string, string>;
    expect(headers["x-csrftoken"]).toBeUndefined();
  });
});
