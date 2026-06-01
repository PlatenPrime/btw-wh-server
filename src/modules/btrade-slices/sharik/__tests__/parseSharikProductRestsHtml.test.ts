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
  it("parses valid pre lines into a map", () => {
    const map = parseSharikProductRestsHtml(fixtureHtml);

    expect(map.get("1501-3445")).toEqual({ quantity: 99, price: 1 });
    expect(map.get("1501-3328")).toEqual({ quantity: 0, price: 122.2 });
    expect(map.get("1302-0065")).toEqual({ quantity: 1500, price: 1640 });
    expect(map.size).toBe(3);
  });

  it("returns empty map for html without pre tags", () => {
    const map = parseSharikProductRestsHtml("<html><body></body></html>");
    expect(map.size).toBe(0);
  });

  it("ignores pre lines that do not match the format", () => {
    const map = parseSharikProductRestsHtml(
      "<pre>not a product line</pre><pre>1501-0001 = 1; 10.00</pre>"
    );
    expect(map.size).toBe(1);
    expect(map.get("1501-0001")).toEqual({ quantity: 1, price: 10 });
  });
});
