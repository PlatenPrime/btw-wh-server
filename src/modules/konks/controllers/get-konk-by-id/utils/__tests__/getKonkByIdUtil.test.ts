import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../../../models/Konk.js";
import { getKonkByIdUtil } from "../getKonkByIdUtil.js";

describe("getKonkByIdUtil", () => {
  beforeEach(async () => {
    await Konk.deleteMany({});
  });

  it("returns null for non-existent id", async () => {
    const result = await getKonkByIdUtil("000000000000000000000000");
    expect(result).toBeNull();
  });

  it("returns full konk document by id", async () => {
    const konk = await Konk.create({
      name: "acme",
      title: "Acme Corp",
      url: "https://example.com",
      imageUrl: "https://example.com/acme.png",
    });
    const result = await getKonkByIdUtil(konk._id.toString());
    expect(result).toBeTruthy();
    expect(result?._id.toString()).toBe(konk._id.toString());
    expect(result?.name).toBe("acme");
    expect(result?.title).toBe("Acme Corp");
    expect(result?.url).toBe("https://example.com");
    expect(result?.imageUrl).toBe("https://example.com/acme.png");
  });
});
