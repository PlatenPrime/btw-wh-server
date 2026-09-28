import { describe, expect, it } from "vitest";
import { resolveAirWarmUpUrl } from "../resolveAirWarmUpUrl.js";

describe("resolveAirWarmUpUrl", () => {
  it("returns origin root for a valid product URL", () => {
    expect(
      resolveAirWarmUpUrl(
        "https://air.ua/ua/product/shar-latex-12-pack-100-sht"
      )
    ).toBe("https://air.ua/");
  });

  it("returns undefined for invalid URL", () => {
    expect(resolveAirWarmUpUrl("not-a-url")).toBeUndefined();
  });
});
