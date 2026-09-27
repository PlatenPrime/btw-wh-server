import { describe, expect, it } from "vitest";
import { getDojdevikStockSchema } from "../getDojdevikStockSchema.js";

describe("getDojdevikStockSchema", () => {
  it("accepts a valid url", () => {
    expect(
      getDojdevikStockSchema.safeParse({
        link: "https://dojdevik.com.ua/ua/p1.html",
      }).success
    ).toBe(true);
  });

  it("rejects empty or invalid link", () => {
    expect(getDojdevikStockSchema.safeParse({ link: "" }).success).toBe(false);
    expect(getDojdevikStockSchema.safeParse({ link: "not-url" }).success).toBe(
      false
    );
  });
});
