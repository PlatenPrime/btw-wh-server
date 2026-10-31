import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { stripSkuProductCodeFixturePreamble } from "../../../sku-product-codes/stripSkuProductCodeFixturePreamble.js";
import { extractPromUaProductArtikul } from "../extractPromUaProductArtikul.js";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "../../../sku-product-codes");

function loadFixture(name: string): string {
  return stripSkuProductCodeFixturePreamble(readFileSync(join(fixturesDir, name), "utf8"));
}

describe("extractPromUaProductArtikul", () => {
  it("reads balun product code from fixture", () => {
    expect(extractPromUaProductArtikul(loadFixture("balun-product-code.txt"))).toBe("11033");
  });

  it("reads dojdevik product code from fixture", () => {
    expect(extractPromUaProductArtikul(loadFixture("dojdevik-product-code.txt"))).toBe("1101-0001");
  });

  it("returns undefined when missing", () => {
    expect(extractPromUaProductArtikul("<html><body>x</body></html>")).toBeUndefined();
  });
});
