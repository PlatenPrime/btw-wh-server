import { describe, expect, it } from "vitest";
import {
  parseBalunAddProductResponse,
  parseBalunChangeQuantityResponse,
} from "../parseBalunCartGraphql.js";

const PRODUCT_ID = "1341824038";

describe("parseBalunAddProductResponse", () => {
  it("reads cartId and unit price from success", () => {
    const body = {
      data: {
        cartAddProduct: {
          __typename: "CartAddProductSuccess",
          self: {
            cartList: {
              carts: [
                {
                  id: "1094691970",
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

    expect(parseBalunAddProductResponse(body, PRODUCT_ID)).toEqual({
      kind: "success",
      cartId: "1094691970",
      unitSellingPrice: 1.46,
    });
  });

  it("parses JSON string bodies", () => {
    const body = JSON.stringify({
      data: {
        cartAddProduct: {
          __typename: "CartAddProductSuccess",
          self: { cartList: { carts: [{ id: "1", items: [] }] } },
        },
      },
    });
    expect(parseBalunAddProductResponse(body, PRODUCT_ID)).toEqual({
      kind: "success",
      cartId: "1",
      unitSellingPrice: null,
    });
  });

  it("maps not-orderable unions", () => {
    expect(
      parseBalunAddProductResponse(
        {
          data: {
            cartAddProduct: { __typename: "ProductNotOrderableError" },
          },
        },
        PRODUCT_ID
      )
    ).toEqual({ kind: "notOrderable" });
    expect(
      parseBalunAddProductResponse(
        {
          data: {
            cartAddProduct: {
              __typename: "CantAddDeletedProductToCartErrorType",
            },
          },
        },
        PRODUCT_ID
      )
    ).toEqual({ kind: "notOrderable" });
  });

  it("maps auth/already-in-cart/invalid payload to error", () => {
    expect(
      parseBalunAddProductResponse(
        { data: { cartAddProduct: { __typename: "AuthenticationError" } } },
        PRODUCT_ID
      )
    ).toEqual({ kind: "error" });
    expect(
      parseBalunAddProductResponse(
        {
          data: {
            cartAddProduct: { __typename: "ProductAlreadyInCartError" },
          },
        },
        PRODUCT_ID
      )
    ).toEqual({ kind: "error" });
    expect(parseBalunAddProductResponse("not-json", PRODUCT_ID)).toEqual({
      kind: "error",
    });
    expect(parseBalunAddProductResponse({ data: {} }, PRODUCT_ID)).toEqual({
      kind: "error",
    });
    expect(
      parseBalunAddProductResponse(
        {
          data: {
            cartAddProduct: {
              __typename: "CartAddProductSuccess",
              self: { cartList: { carts: [{ id: "  ", items: [] }] } },
            },
          },
        },
        PRODUCT_ID
      )
    ).toEqual({ kind: "error" });
    expect(
      parseBalunAddProductResponse(
        {
          data: {
            cartAddProduct: {
              __typename: "CartAddProductSuccess",
              self: { cartList: {} },
            },
          },
        },
        PRODUCT_ID
      )
    ).toEqual({ kind: "error" });
    expect(parseBalunAddProductResponse([], PRODUCT_ID)).toEqual({
      kind: "error",
    });
  });

  it("picks matching productId among cart items", () => {
    const body = {
      data: {
        cartAddProduct: {
          __typename: "CartAddProductSuccess",
          self: {
            cartList: {
              carts: [
                {
                  id: "c1",
                  items: [
                    {
                      productId: "other",
                      price: { unit: { selling: "9" } },
                    },
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
    expect(parseBalunAddProductResponse(body, PRODUCT_ID)).toEqual({
      kind: "success",
      cartId: "c1",
      unitSellingPrice: 1.46,
    });
  });

  it("falls back to first cart item when productId is absent", () => {
    expect(
      parseBalunAddProductResponse(
        {
          data: {
            cartAddProduct: {
              __typename: "CartAddProductSuccess",
              self: {
                cartList: {
                  carts: [
                    {
                      id: "c1",
                      items: [
                        { price: { unit: { selling: 2 } } },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
        PRODUCT_ID
      )
    ).toEqual({
      kind: "success",
      cartId: "c1",
      unitSellingPrice: 2,
    });
  });
});

describe("parseBalunChangeQuantityResponse", () => {
  it("reads recalculated stock when reason is warehouse clamp", () => {
    const body = {
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
    expect(parseBalunChangeQuantityResponse(body, PRODUCT_ID)).toEqual({
      kind: "recalculated",
      quantity: 371,
      unitSellingPrice: 1.46,
    });
  });

  it("accepts numeric string quantity", () => {
    expect(
      parseBalunChangeQuantityResponse(
        {
          data: {
            cartChangeProductQuantity: {
              __typename: "RequestedQuantityRecalculatedType",
              recalculatedReason: "EXCEEDS_AMOUNT_OF_PRODUCT_IN_STOCK",
              recalculatedQuantity: "371.0",
            },
          },
        },
        PRODUCT_ID
      )
    ).toEqual({
      kind: "recalculated",
      quantity: 371,
      unitSellingPrice: null,
    });
  });

  it("returns set when qty was accepted as-is", () => {
    expect(
      parseBalunChangeQuantityResponse(
        {
          data: {
            cartChangeProductQuantity: {
              __typename: "RequestedQuantitySet",
            },
          },
        },
        PRODUCT_ID
      )
    ).toEqual({ kind: "set" });
  });

  it("rejects clamp with unknown reason or invalid quantity", () => {
    expect(
      parseBalunChangeQuantityResponse(
        {
          data: {
            cartChangeProductQuantity: {
              __typename: "RequestedQuantityRecalculatedType",
              recalculatedReason: "OTHER",
              recalculatedQuantity: 371,
            },
          },
        },
        PRODUCT_ID
      )
    ).toEqual({ kind: "error" });
    expect(
      parseBalunChangeQuantityResponse(
        {
          data: {
            cartChangeProductQuantity: {
              __typename: "RequestedQuantityRecalculatedType",
              recalculatedReason: "EXCEEDS_AMOUNT_OF_PRODUCT_IN_STOCK",
              recalculatedQuantity: -1,
            },
          },
        },
        PRODUCT_ID
      )
    ).toEqual({ kind: "error" });
    expect(
      parseBalunChangeQuantityResponse(
        {
          data: {
            cartChangeProductQuantity: {
              __typename: "CartChangeProductQuantityError",
            },
          },
        },
        PRODUCT_ID
      )
    ).toEqual({ kind: "error" });
    expect(parseBalunChangeQuantityResponse({}, PRODUCT_ID)).toEqual({
      kind: "error",
    });
    expect(
      parseBalunChangeQuantityResponse(
        {
          data: {
            cartChangeProductQuantity: {
              __typename: "RequestedQuantityRecalculatedType",
              recalculatedReason: "EXCEEDS_AMOUNT_OF_PRODUCT_IN_STOCK",
              recalculatedQuantity: true,
            },
          },
        },
        PRODUCT_ID
      )
    ).toEqual({ kind: "error" });
  });

  it("returns null unit price when item price shape is incomplete", () => {
    expect(
      parseBalunChangeQuantityResponse(
        {
          data: {
            cartChangeProductQuantity: {
              __typename: "RequestedQuantityRecalculatedType",
              recalculatedReason: "EXCEEDS_AMOUNT_OF_PRODUCT_IN_STOCK",
              recalculatedQuantity: 10,
              self: {
                cartList: {
                  cart: {
                    items: [{ productId: PRODUCT_ID, price: { unit: {} } }],
                  },
                },
              },
            },
          },
        },
        PRODUCT_ID
      )
    ).toEqual({
      kind: "recalculated",
      quantity: 10,
      unitSellingPrice: null,
    });
  });
});
