import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../../../models/Konk.js";
import { getAllKonksUtil } from "../getAllKonksUtil.js";

describe("getAllKonksUtil", () => {
  beforeEach(async () => {
    await Konk.deleteMany({});
  });

  it("returns empty array when no konks", async () => {
    const result = await getAllKonksUtil();
    expect(result).toEqual([]);
  });

  it("returns all konks with full fields", async () => {
    await Konk.create({
      name: "a",
      title: "A",
      url: "https://a.com",
      imageUrl: "https://a.com/1.png",
    });
    const result = await getAllKonksUtil();
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("name", "a");
    expect(result[0]).toHaveProperty("title", "A");
    expect(result[0]).toHaveProperty("url", "https://a.com");
    expect(result[0]).toHaveProperty("imageUrl", "https://a.com/1.png");
    expect(result[0]).toHaveProperty("_id");
    expect(result[0]).toHaveProperty("createdAt");
    expect(result[0]).toHaveProperty("updatedAt");
  });

  it("returns multiple konks sorted by createdAt desc", async () => {
    await Konk.create({
      name: "first",
      title: "First",
      url: "https://f.com",
      imageUrl: "https://f.com/1.png",
    });
    await Konk.create({
      name: "second",
      title: "Second",
      url: "https://s.com",
      imageUrl: "https://s.com/1.png",
    });
    const result = await getAllKonksUtil();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("second");
    expect(result[1].name).toBe("first");
  });
});
