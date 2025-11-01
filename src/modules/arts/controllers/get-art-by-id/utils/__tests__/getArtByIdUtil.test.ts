import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../../models/Art.js";
import { getArtByIdUtil } from "../getArtByIdUtil.js";

describe("getArtByIdUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("возвращает null если артикул не найден", async () => {
    const result = await getArtByIdUtil("000000000000000000000000");

    expect(result).toBeNull();
  });

  it("возвращает артикул по ID", async () => {
    const art = await Art.create({ artikul: "ART-001", zone: "A1" });

    const result = await getArtByIdUtil(art._id.toString());

    expect(result).toBeTruthy();
    expect(result?._id.toString()).toBe(art._id.toString());
    expect(result?.artikul).toBe("ART-001");
  });

  it("возвращает артикул с правильной структурой", async () => {
    const art = await Art.create({
      artikul: "ART-002",
      nameukr: "Test Art",
      zone: "A2",
      limit: 100,
    });

    const result = await getArtByIdUtil(art._id.toString());

    expect(result).toBeTruthy();
    expect(result?._id).toBeDefined();
    expect(result?.artikul).toBe("ART-002");
    expect(result?.nameukr).toBe("Test Art");
    expect(result?.limit).toBe(100);
    expect(result?.createdAt).toBeDefined();
    expect(result?.updatedAt).toBeDefined();
  });
});

