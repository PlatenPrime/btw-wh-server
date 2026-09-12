import { describe, expect, it } from "vitest";
import { extractSvbumPackCount } from "../extractSvbumPackCount.js";

describe("extractSvbumPackCount", () => {
  it("reads (Nшт) and (N шт)", () => {
    expect(extractSvbumPackCount("упаковка (20шт)")).toBe(20);
    expect(extractSvbumPackCount("упаковка (100шт)")).toBe(100);
    expect(extractSvbumPackCount("Товар (10 шт)")).toBe(10);
  });

  it("reads N шт without parens", () => {
    expect(extractSvbumPackCount('Серветки "Горох" 10 шт')).toBe(10);
    expect(extractSvbumPackCount("набір 50шт")).toBe(50);
  });

  it("ignores inches and grams without шт", () => {
    expect(
      extractSvbumPackCount('Фольгована кулька серце зелене 18" AS-10015 ArtShow')
    ).toBeNull();
    expect(extractSvbumPackCount("Наповнювач паперова стружка білий 100г")).toBeNull();
  });

  it("returns null for empty or unrelated text", () => {
    expect(extractSvbumPackCount("")).toBeNull();
    expect(extractSvbumPackCount("Blue Petrol (УП)")).toBeNull();
  });
});
