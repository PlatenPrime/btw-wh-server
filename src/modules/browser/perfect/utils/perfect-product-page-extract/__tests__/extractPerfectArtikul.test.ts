import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { stripSkuProductCodeFixturePreamble } from "../../../../sku-product-codes/stripSkuProductCodeFixturePreamble.js";
import { extractPerfectArtikul } from "../perfectProductPageExtract.js";

const fixture = stripSkuProductCodeFixturePreamble(
  readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      "../../../../sku-product-codes/perfect-product-code.txt",
    ),
    "utf8",
  ),
);

describe("extractPerfectArtikul", () => {
  it("reads reference from fixture", () => {
    expect(extractPerfectArtikul(fixture)).toBe("11230011");
  });

  it("returns undefined when missing", () => {
    expect(extractPerfectArtikul("<html><body></body></html>")).toBeUndefined();
  });
});
