import { describe, expect, it } from "vitest";
import { AIR_CLIENT_SKUGR_PRODUCTS_MAX } from "../../../../constants/airClientSkugrFill.js";
import { postAirClientFillPageSchema } from "../postAirClientFillPageSchema.js";

describe("postAirClientFillPageSchema", () => {
  const product = {
    productId: "111",
    title: "One",
    url: "https://airballoons.com.ua/ua/product/p111",
    imageUrl: "https://airballoons.com.ua/img/a.jpg",
  };

  const valid = {
    id: "507f1f77bcf86cd799439011",
    sourceUrl:
      "https://airballoons.com.ua/ua/index.php?route=product/category&path=1",
    pageUrl:
      "https://airballoons.com.ua/ua/index.php?route=product/category&path=1&page=2",
    products: [product],
    nextPageUrl:
      "https://airballoons.com.ua/ua/index.php?route=product/category&path=1&page=3",
    hasListingMarkup: true,
  };

  it("accepts valid payload", () => {
    expect(postAirClientFillPageSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts empty products with null nextPageUrl", () => {
    expect(
      postAirClientFillPageSchema.safeParse({
        ...valid,
        products: [],
        nextPageUrl: null,
      }).success
    ).toBe(true);
  });

  it("rejects invalid id", () => {
    expect(
      postAirClientFillPageSchema.safeParse({ ...valid, id: "bad" }).success
    ).toBe(false);
  });

  it("rejects too many products", () => {
    expect(
      postAirClientFillPageSchema.safeParse({
        ...valid,
        products: Array.from({ length: AIR_CLIENT_SKUGR_PRODUCTS_MAX + 1 }, () => ({
          ...product,
        })),
      }).success
    ).toBe(false);
  });

  it("rejects product without url", () => {
    expect(
      postAirClientFillPageSchema.safeParse({
        ...valid,
        products: [{ ...product, url: "not-url" }],
      }).success
    ).toBe(false);
  });

  it("rejects invalid pageUrl", () => {
    expect(
      postAirClientFillPageSchema.safeParse({
        ...valid,
        pageUrl: "not-url",
      }).success
    ).toBe(false);
  });

  it("rejects missing hasListingMarkup", () => {
    expect(
      postAirClientFillPageSchema.safeParse({
        id: valid.id,
        sourceUrl: valid.sourceUrl,
        pageUrl: valid.pageUrl,
        products: valid.products,
        nextPageUrl: valid.nextPageUrl,
      }).success
    ).toBe(false);
  });
});
