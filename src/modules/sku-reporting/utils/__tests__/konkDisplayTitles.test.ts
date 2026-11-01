import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../../konks/models/Konk.js";
import { loadKonkDisplayMetaByName } from "../konkDisplayTitles.js";

describe("loadKonkDisplayMetaByName", () => {
  beforeEach(async () => {
    await Konk.deleteMany({});
  });

  it("loads title and recountDays; falls back to name when missing", async () => {
    await Konk.create({
      name: "air",
      title: "Air UA",
      url: "https://e.com/air",
      imageUrl: "https://e.com/air.png",
      recountDays: ["2026-01-01"],
    });

    const map = await loadKonkDisplayMetaByName(["air", "missing"]);
    expect(map.get("air")).toEqual({
      title: "Air UA",
      recountDays: ["2026-01-01"],
    });
    expect(map.get("missing")).toEqual({ title: "missing", recountDays: [] });
  });

  it("returns empty map for empty input", async () => {
    expect(await loadKonkDisplayMetaByName([])).toEqual(new Map());
  });
});
