import { describe, expect, it } from "vitest";
import { getSvbumGroupPagesProductsSchema } from "../getSvbumGroupPagesProductsSchema.js";

describe("getSvbumGroupPagesProductsSchema", () => {
  it("accepts groupUrl and optional maxPages", () => {
    const parsed = getSvbumGroupPagesProductsSchema.parse({
      groupUrl:
        "https://sviatobum.ua/povitryani-kuli/lateksni-kulki/?ocf=abc",
      maxPages: 3,
    });
    expect(parsed.maxPages).toBe(3);
  });

  it("rejects empty or invalid groupUrl", () => {
    expect(
      getSvbumGroupPagesProductsSchema.safeParse({ groupUrl: "" }).success
    ).toBe(false);
    expect(
      getSvbumGroupPagesProductsSchema.safeParse({ groupUrl: "not-a-url" })
        .success
    ).toBe(false);
  });

  it("rejects maxPages outside 1–200", () => {
    expect(
      getSvbumGroupPagesProductsSchema.safeParse({
        groupUrl: "https://sviatobum.ua/g",
        maxPages: 0,
      }).success
    ).toBe(false);
    expect(
      getSvbumGroupPagesProductsSchema.safeParse({
        groupUrl: "https://sviatobum.ua/g",
        maxPages: 201,
      }).success
    ).toBe(false);
  });
});
