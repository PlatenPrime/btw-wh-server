import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseSharikProductRestsHtml } from "../parseSharikProductRestsHtml.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureHtml = readFileSync(
  join(__dirname, "fixtures", "product-rests-sample.html"),
  "utf-8"
);

describe("parseSharikProductRestsHtml", () => {
  it("parses dual-qty pre lines; last duplicate wins", () => {
    const map = parseSharikProductRestsHtml(fixtureHtml);

    expect(map.get("1501-3445")).toEqual({
      actualQuantity: 99,
      sliceQuantity: 50,
      price: 1,
    });
    expect(map.get("1501-3328")).toEqual({
      actualQuantity: 0,
      sliceQuantity: 0,
      price: 122.2,
    });
    expect(map.get("1302-0065")).toEqual({
      actualQuantity: 1500,
      sliceQuantity: 1500,
      price: 1640,
    });
    expect(map.get("3501-3255")).toEqual({
      actualQuantity: 0,
      sliceQuantity: 6,
      price: 187.62,
    });
    expect(map.size).toBe(4);
  });

  it("returns empty map for html without pre tags", () => {
    const map = parseSharikProductRestsHtml("<html><body></body></html>");
    expect(map.size).toBe(0);
  });

  it("ignores old single-qty format and invalid lines", () => {
    const map = parseSharikProductRestsHtml(
      "<pre>not a product line</pre><pre>1501-0001 = 1; 10.00</pre><pre>1501-0002 = 1; 2; 10.00</pre>"
    );
    expect(map.size).toBe(1);
    expect(map.get("1501-0002")).toEqual({
      actualQuantity: 1,
      sliceQuantity: 2,
      price: 10,
    });
  });
});
