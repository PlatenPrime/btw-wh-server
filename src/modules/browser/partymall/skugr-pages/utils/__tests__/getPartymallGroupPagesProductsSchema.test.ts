import { describe, expect, it } from "vitest";
import { getPartymallGroupPagesProductsSchema } from "../getPartymallGroupPagesProductsSchema.js";

describe("getPartymallGroupPagesProductsSchema", () => {
  it("accepts groupUrl and optional maxPages", () => {
    const parsed = getPartymallGroupPagesProductsSchema.parse({
      groupUrl:
        "https://partymall.ua/vozdushnyje-shary/lateksnye-shary-145712766/kruglye-bez-risunka-145712629/belbal-1?ocf=abc",
      maxPages: 3,
    });
    expect(parsed.maxPages).toBe(3);
  });

  it("rejects empty or invalid groupUrl", () => {
    expect(getPartymallGroupPagesProductsSchema.safeParse({ groupUrl: "" }).success).toBe(false);
    expect(getPartymallGroupPagesProductsSchema.safeParse({ groupUrl: "not-a-url" }).success).toBe(
      false,
    );
  });

  it("rejects maxPages outside 1–200", () => {
    expect(
      getPartymallGroupPagesProductsSchema.safeParse({
        groupUrl: "https://partymall.ua/g",
        maxPages: 0,
      }).success,
    ).toBe(false);
    expect(
      getPartymallGroupPagesProductsSchema.safeParse({
        groupUrl: "https://partymall.ua/g",
        maxPages: 201,
      }).success,
    ).toBe(false);
  });
});
