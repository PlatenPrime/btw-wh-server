import { describe, expect, it } from "vitest";
import { extractPieceCountFromTitle } from "../extractPieceCountFromTitle.js";

describe("extractPieceCountFromTitle", () => {
  it("достаёт N из скобок (Nшт)", () => {
    expect(extractPieceCountFromTitle("Товар (100шт)")).toBe(100);
    expect(extractPieceCountFromTitle("Товар (10 шт)")).toBe(10);
  });

  it("возвращает null без шаблона", () => {
    expect(extractPieceCountFromTitle("Blue Petrol (УП)")).toBeNull();
  });
});
