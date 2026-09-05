import { describe, expect, it } from "vitest";
import {
  isAirListingPageOfGroup,
  sourceUrlMatchesSkugrUrl,
} from "../isAirListingPageOfGroup.js";

const GROUP =
  "https://airballoons.com.ua/ua/index.php?route=product/category&path=59";

describe("sourceUrlMatchesSkugrUrl", () => {
  it("matches trailing slash variants", () => {
    expect(
      sourceUrlMatchesSkugrUrl(
        "https://airballoons.com.ua/ua/category/x/",
        "https://airballoons.com.ua/ua/category/x"
      )
    ).toBe(true);
  });

  it("rejects different paths", () => {
    expect(
      sourceUrlMatchesSkugrUrl(
        "https://airballoons.com.ua/ua/category/a",
        "https://airballoons.com.ua/ua/category/b"
      )
    ).toBe(false);
  });
});

describe("isAirListingPageOfGroup", () => {
  it("accepts the group url itself", () => {
    expect(isAirListingPageOfGroup(GROUP, GROUP)).toBe(true);
  });

  it("accepts page query on the same listing", () => {
    expect(isAirListingPageOfGroup(`${GROUP}&page=2`, GROUP)).toBe(true);
  });

  it("rejects a different path", () => {
    expect(
      isAirListingPageOfGroup(
        "https://airballoons.com.ua/ua/product/x",
        GROUP
      )
    ).toBe(false);
  });

  it("rejects a different origin", () => {
    expect(
      isAirListingPageOfGroup(
        "https://evil.example/ua/index.php?route=product/category&path=59",
        GROUP
      )
    ).toBe(false);
  });

  it("rejects extra query keys", () => {
    expect(isAirListingPageOfGroup(`${GROUP}&sort=price`, GROUP)).toBe(false);
  });

  it("returns false for invalid urls", () => {
    expect(isAirListingPageOfGroup("not-a-url", GROUP)).toBe(false);
  });
});
