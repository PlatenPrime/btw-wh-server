import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../../../models/Konk.js";
import { getKonkByNameUtil } from "../getKonkByNameUtil.js";

describe("getKonkByNameUtil", () => {
  beforeEach(async () => {
    await Konk.deleteMany({});
  });

  it("returns null when konk not found", async () => {
    const result = await getKonkByNameUtil("nonexistent");
    expect(result).toBeNull();
  });

  it("returns konk by name", async () => {
    const konk = await Konk.create({
      name: "acme",
      title: "Acme Corp",
      url: "https://example.com",
      imageUrl: "https://example.com/acme.png",
    });
    const result = await getKonkByNameUtil("acme");
    expect(result).toBeTruthy();
    expect(result?._id.toString()).toBe(konk._id.toString());
    expect(result?.name).toBe("acme");
    expect(result?.title).toBe("Acme Corp");
  });
});
