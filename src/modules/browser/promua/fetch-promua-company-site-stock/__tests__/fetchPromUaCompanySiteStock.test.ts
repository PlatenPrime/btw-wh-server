import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPromUaCompanySiteStock } from "../fetchPromUaCompanySiteStock.js";
import { getBrowserAxios } from "../../../utils/browserRequest.js";
import {
  ADD_PRODUCT_TO_CART_QUERY,
  CART_CHANGE_PRODUCT_QUANTITY_QUERY,
  PROMUA_CART_PROBE_QUANTITY,
} from "../../cart/promUaCartGraphqlQueries.js";

vi.mock("../../../utils/browserRequest.js", () => ({
  getBrowserAxios: vi.fn(),
  logBrowserError: vi.fn(),
}));

const ORIGIN = "https://example.com.ua";
const PRODUCT_URL = "https://example.com.ua/ua/p123-item.html";
const PRODUCT_ID = "123";
const CART_ID = "cart-1";
const NEGATIVE = { stock: -1, price: -1 };

type Ctx = { htmlPrice: number | undefined };

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
                  price: { unit: { selling: "2.00" } },
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
      recalculatedQuantity: 42,
      self: {
        cartList: {
          cart: {
            items: [
              {
                productId: PRODUCT_ID,
                price: { unit: { selling: "2.00" } },
              },
            ],
          },
        },
      },
    },
  },
};

function baseParams(
  overrides: Partial<
    Parameters<typeof fetchPromUaCompanySiteStock<Ctx, typeof NEGATIVE>>[0]
  > = {}
) {
  return {
    origin: ORIGIN,
    productUrl: PRODUCT_URL,
    negativeOutcome: NEGATIVE,
    logLabel: "test",
    parseHtmlContext: (): Ctx => ({ htmlPrice: 1.5 }),
    resolveHtmlPrice: (ctx: Ctx) => ctx.htmlPrice,
    normalizeOutcome: ({
      quantity,
      unitPrice,
    }: {
      quantity: number;
      unitPrice: number | undefined;
      ctx: Ctx;
    }) =>
      unitPrice === undefined
        ? NEGATIVE
        : { stock: quantity, price: unitPrice },
    ...overrides,
  };
}

describe("fetchPromUaCompanySiteStock", () => {
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

  it("returns negative when productId is missing", async () => {
    const result = await fetchPromUaCompanySiteStock(
      baseParams({ productUrl: "https://example.com.ua/no-id" })
    );
    expect(result).toEqual(NEGATIVE);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("returns negative when HTML is empty", async () => {
    mockGet.mockResolvedValue({ data: "   ", headers: {} });
    const result = await fetchPromUaCompanySiteStock(baseParams());
    expect(result).toEqual(NEGATIVE);
  });

  it("returns stock 0 with HTML price when not orderable", async () => {
    mockGet.mockResolvedValue({ data: "<html>ok</html>", headers: {} });
    mockPost.mockResolvedValue({
      status: 200,
      data: {
        data: {
          cartAddProduct: {
            __typename: "ProductNotOrderableError",
          },
        },
      },
      headers: {},
    });

    const result = await fetchPromUaCompanySiteStock(baseParams());
    expect(result).toEqual({ stock: 0, price: 1.5 });
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost.mock.calls[0][0]).toContain("AddProductToCart");
  });

  it("returns recalculated quantity and resolved price on success", async () => {
    mockGet.mockResolvedValue({ data: "<html>ok</html>", headers: {} });
    mockPost
      .mockResolvedValueOnce({
        status: 200,
        data: ADD_SUCCESS,
        headers: {},
      })
      .mockResolvedValueOnce({
        status: 200,
        data: CHANGE_RECALCULATED,
        headers: {},
      });

    const result = await fetchPromUaCompanySiteStock(baseParams());
    expect(result).toEqual({ stock: 42, price: 1.5 });
    expect(mockPost).toHaveBeenCalledTimes(2);
    expect(mockPost.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        operationName: "AddProductToCart",
        query: ADD_PRODUCT_TO_CART_QUERY,
      })
    );
    expect(mockPost.mock.calls[1][1]).toEqual(
      expect.objectContaining({
        operationName: "CartChangeProductQuantity",
        query: CART_CHANGE_PRODUCT_QUANTITY_QUERY,
        variables: expect.objectContaining({
          payload: expect.objectContaining({
            quantity: PROMUA_CART_PROBE_QUANTITY,
          }),
        }),
      })
    );
  });

  it("falls back to GraphQL price when HTML price is missing", async () => {
    mockGet.mockResolvedValue({ data: "<html>ok</html>", headers: {} });
    mockPost
      .mockResolvedValueOnce({
        status: 200,
        data: ADD_SUCCESS,
        headers: {},
      })
      .mockResolvedValueOnce({
        status: 200,
        data: CHANGE_RECALCULATED,
        headers: {},
      });

    const result = await fetchPromUaCompanySiteStock(
      baseParams({
        parseHtmlContext: () => ({ htmlPrice: undefined }),
      })
    );
    expect(result).toEqual({ stock: 42, price: 2 });
  });

  it("returns negative on add HTTP error", async () => {
    mockGet.mockResolvedValue({ data: "<html>ok</html>", headers: {} });
    mockPost.mockResolvedValue({ status: 500, data: {}, headers: {} });
    const result = await fetchPromUaCompanySiteStock(baseParams());
    expect(result).toEqual(NEGATIVE);
  });

  it("returns negative on network error", async () => {
    mockGet.mockRejectedValue(new Error("network"));
    const result = await fetchPromUaCompanySiteStock(baseParams());
    expect(result).toEqual(NEGATIVE);
  });
});
