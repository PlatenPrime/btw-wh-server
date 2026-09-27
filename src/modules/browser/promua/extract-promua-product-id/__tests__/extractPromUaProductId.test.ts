import { describe, expect, it } from "vitest";
import { extractPromUaProductId } from "../extractPromUaProductId.js";

describe("extractPromUaProductId", () => {
  it("reads id from localized product URL", () => {
    expect(
      extractPromUaProductId(
        "https://balun.com.ua/ua/p1341824038-folgirovannaya-sharik-zvezda.html"
      )
    ).toBe("1341824038");
  });

  it("reads id from URL without locale prefix", () => {
    expect(
      extractPromUaProductId(
        "https://dojdevik.com.ua/p17755382-vozdushnye-shary-prozrachnye.html"
      )
    ).toBe("17755382");
  });

  it("reads id when query string follows the slug", () => {
    expect(extractPromUaProductId("https://balun.com.ua/p99?utm=1")).toBe("99");
  });

  it("reads id when the file suffix follows the id", () => {
    expect(
      extractPromUaProductId("https://balun.com.ua/p1341824038.html")
    ).toBe("1341824038");
  });

  it("returns undefined when /p{id} is missing", () => {
    expect(
      extractPromUaProductId("https://balun.com.ua/ua/catalog")
    ).toBeUndefined();
    expect(
      extractPromUaProductId("https://example.com/product/1")
    ).toBeUndefined();
  });
});
