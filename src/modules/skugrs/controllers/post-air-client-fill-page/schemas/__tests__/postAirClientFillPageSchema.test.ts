import { describe, expect, it } from "vitest";
import { AIR_CLIENT_SKUGR_HTML_MAX_CHARS } from "../../../../constants/airClientSkugrFill.js";
import { postAirClientFillPageSchema } from "../postAirClientFillPageSchema.js";

describe("postAirClientFillPageSchema", () => {
  const valid = {
    id: "507f1f77bcf86cd799439011",
    sourceUrl:
      "https://airballoons.com.ua/ua/index.php?route=product/category&path=1",
    pageUrl:
      "https://airballoons.com.ua/ua/index.php?route=product/category&path=1&page=2",
    html: "<html><body>ok</body></html>",
  };

  it("accepts valid payload", () => {
    expect(postAirClientFillPageSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid id", () => {
    expect(
      postAirClientFillPageSchema.safeParse({ ...valid, id: "bad" }).success
    ).toBe(false);
  });

  it("rejects empty html", () => {
    expect(
      postAirClientFillPageSchema.safeParse({ ...valid, html: "" }).success
    ).toBe(false);
  });

  it("rejects html above max length", () => {
    expect(
      postAirClientFillPageSchema.safeParse({
        ...valid,
        html: "x".repeat(AIR_CLIENT_SKUGR_HTML_MAX_CHARS + 1),
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
});
