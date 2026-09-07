import { describe, expect, it } from "vitest";
import {
  ADD_PRODUCT_TO_CART_QUERY,
  BALUN_PROBE_QUANTITY,
  CART_CHANGE_PRODUCT_QUANTITY_QUERY,
} from "../balunGraphqlQueries.js";

describe("balunGraphqlQueries", () => {
  it("exposes clamp probe quantity", () => {
    expect(BALUN_PROBE_QUANTITY).toBe(999_999);
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
