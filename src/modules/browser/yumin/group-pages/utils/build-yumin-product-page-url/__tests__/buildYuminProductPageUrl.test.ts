import { describe, expect, it } from "vitest";
import { buildYuminProductPageUrl } from "../buildYuminProductPageUrl.js";

describe("buildYuminProductPageUrl", () => {
  it("builds absolute product URL from url_key", () => {
    expect(
      buildYuminProductPageUrl(
        "https://yumi.market/api/products?category=1",
        "balloons/red"
      )
    ).toBe("https://yumi.market/balloons/red");
  });

  it("strips leading slashes from url_key", () => {
    expect(
      buildYuminProductPageUrl("https://yumi.market/api/x", "/path/item")
    ).toBe("https://yumi.market/path/item");
  });
});
