import { describe, expect, it } from "vitest";
import { extractBalunProductId } from "../extractBalunProductId.js";

describe("extractBalunProductId", () => {
  it("reads id from localized product URL", () => {
    expect(
      extractBalunProductId(
        "https://balun.com.ua/ua/p1341824038-folgirovannaya-sharik-zvezda.html"
      )
    ).toBe("1341824038");
  });

  it("reads id from URL without locale prefix", () => {
    expect(
      extractBalunProductId(
        "https://balun.com.ua/p1341824038-folgirovannaya-sharik-zvezda.html"
      )
    ).toBe("1341824038");
  });

  it("reads id when query string follows the slug", () => {
    expect(
      extractBalunProductId("https://balun.com.ua/p99?utm=1")
    ).toBe("99");
  });

  it("reads id when the file suffix follows the id", () => {
    expect(
      extractBalunProductId("https://balun.com.ua/p1341824038.html")
    ).toBe("1341824038");
  });

  it("returns undefined when /p{id} is missing", () => {
    expect(extractBalunProductId("https://balun.com.ua/ua/catalog")).toBeUndefined();
    expect(extractBalunProductId("https://example.com/product/1")).toBeUndefined();
  });
});
