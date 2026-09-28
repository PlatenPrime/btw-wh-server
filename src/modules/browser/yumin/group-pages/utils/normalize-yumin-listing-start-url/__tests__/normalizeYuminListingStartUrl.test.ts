import { describe, expect, it } from "vitest";
import { normalizeYuminListingStartUrl } from "../normalizeYuminListingStartUrl.js";

describe("normalizeYuminListingStartUrl", () => {
  it("strips page query param", () => {
    expect(
      normalizeYuminListingStartUrl(
        "https://yumi.market/api/products?category=1&page=3"
      )
    ).toBe("https://yumi.market/api/products?category=1");
  });

  it("keeps URL without page", () => {
    expect(
      normalizeYuminListingStartUrl("https://yumi.market/api/products?category=1")
    ).toBe("https://yumi.market/api/products?category=1");
  });
});
