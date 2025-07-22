import { describe, expect, it } from "vitest";
import { sortPalletsByTitle } from "./sortPalletsByTitle.js";

function mapPalletsToTitle(pallets: { title: string }[]) {
  return pallets.map((p) => p.title);
}

describe("sortPalletsByTitle", () => {
  it("сортирует паллеты по title с числами через дефис", () => {
    const pallets = [
      { title: "2-10" },
      { title: "1-2" },
      { title: "1-10" },
      { title: "2-2" },
      { title: "1-1" },
    ];
    const sorted = sortPalletsByTitle([...pallets]);
    expect(mapPalletsToTitle(sorted)).toEqual([
      "1-1",
      "1-2",
      "1-10",
      "2-2",
      "2-10",
    ]);
  });

  it("корректно работает с однозначными и двузначными числами", () => {
    const pallets = [{ title: "10-1" }, { title: "2-1" }, { title: "1-1" }];
    const sorted = sortPalletsByTitle([...pallets]);
    expect(mapPalletsToTitle(sorted)).toEqual(["1-1", "2-1", "10-1"]);
  });

  it("не меняет порядок, если уже отсортировано", () => {
    const pallets = [{ title: "1-1" }, { title: "1-2" }, { title: "2-1" }];
    const sorted = sortPalletsByTitle([...pallets]);
    expect(mapPalletsToTitle(sorted)).toEqual(["1-1", "1-2", "2-1"]);
  });

  it("работает с одинаковыми title", () => {
    const pallets = [{ title: "1-1" }, { title: "1-1" }, { title: "1-2" }];
    const sorted = sortPalletsByTitle([...pallets]);
    expect(mapPalletsToTitle(sorted)).toEqual(["1-1", "1-1", "1-2"]);
  });

  it("работает с пустым массивом", () => {
    expect(sortPalletsByTitle([])).toEqual([]);
  });
});
