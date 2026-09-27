import { describe, expect, it } from "vitest";
import { getDojdevikGroupPagesProductsSchema } from "../getDojdevikGroupPagesProductsSchema.js";

describe("getDojdevikGroupPagesProductsSchema", () => {
  it("accepts valid groupUrl", () => {
    expect(
      getDojdevikGroupPagesProductsSchema.safeParse({
        groupUrl: "https://dojdevik.com.ua/ua/g1",
      }).success
    ).toBe(true);
  });

  it("rejects invalid groupUrl or maxPages", () => {
    expect(
      getDojdevikGroupPagesProductsSchema.safeParse({ groupUrl: "" }).success
    ).toBe(false);
    expect(
      getDojdevikGroupPagesProductsSchema.safeParse({
        groupUrl: "https://dojdevik.com.ua/ua/g1",
        maxPages: 0,
      }).success
    ).toBe(false);
  });
});
