import { describe, expect, it } from "vitest";
import {
  ADD_PRODUCT_TO_CART_QUERY,
  CART_CHANGE_PRODUCT_QUANTITY_QUERY,
  PROMUA_CART_PROBE_QUANTITY,
} from "../promUaCartGraphqlQueries.js";

describe("promUaCartGraphqlQueries", () => {
  it("exposes clamp probe quantity of 10 billion", () => {
    expect(PROMUA_CART_PROBE_QUANTITY).toBe(10_000_000_000);
  });

  it("keeps AddProductToCart union fields", () => {
    expect(ADD_PRODUCT_TO_CART_QUERY).toContain("mutation AddProductToCart");
    expect(ADD_PRODUCT_TO_CART_QUERY).toContain("cartAddProduct");
    expect(ADD_PRODUCT_TO_CART_QUERY).toContain("CartAddProductSuccess");
    expect(ADD_PRODUCT_TO_CART_QUERY).toContain("ProductNotOrderableError");
  });

  it("keeps CartChangeProductQuantity clamp fields", () => {
    expect(CART_CHANGE_PRODUCT_QUANTITY_QUERY).toContain(
      "mutation CartChangeProductQuantity"
    );
    expect(CART_CHANGE_PRODUCT_QUANTITY_QUERY).toContain("recalculatedQuantity");
    expect(CART_CHANGE_PRODUCT_QUANTITY_QUERY).toContain(
      "RequestedQuantityRecalculatedType"
    );
    expect(CART_CHANGE_PRODUCT_QUANTITY_QUERY).toContain("RequestedQuantitySet");
  });
});
