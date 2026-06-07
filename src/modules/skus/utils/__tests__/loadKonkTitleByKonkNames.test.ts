import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../../konks/models/Konk.js";
import { loadKonkTitleByKonkNames } from "../loadKonkTitleByKonkNames.js";

describe("loadKonkTitleByKonkNames", () => {
  beforeEach(async () => {
    await Konk.deleteMany({});
  });

  it("returns empty map for empty input", async () => {
    const map = await loadKonkTitleByKonkNames([]);
    expect(map.size).toBe(0);
  });

  it("maps konk name to title and deduplicates names", async () => {
    await Konk.create({
      name: "air",
      title: "Air Shop",
      url: "https://air.example",
      imageUrl: "https://air.example/i.png",
    });
    await Konk.create({
      name: "rozetka",
      title: "Rozetka UA",
      url: "https://roz.example",
      imageUrl: "https://roz.example/i.png",
    });

    const map = await loadKonkTitleByKonkNames(["air", "air", "rozetka", ""]);
    expect(map.get("air")).toBe("Air Shop");
    expect(map.get("rozetka")).toBe("Rozetka UA");
    expect(map.has("")).toBe(false);
  });

  it("omits unknown konk names", async () => {
    const map = await loadKonkTitleByKonkNames(["missing"]);
    expect(map.size).toBe(0);
  });
});
