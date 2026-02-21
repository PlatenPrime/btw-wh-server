import { beforeEach, describe, expect, it } from "vitest";
import { Del } from "../../../../models/Del.js";
import { getAllDelsUtil } from "../getAllDelsUtil.js";

describe("getAllDelsUtil", () => {
  beforeEach(async () => {
    await Del.deleteMany({});
  });

  it("returns empty array when no dels", async () => {
    const result = await getAllDelsUtil();
    expect(result).toEqual([]);
  });

  it("returns list without artikuls field and with prod", async () => {
    await Del.create({
      title: "Поставка 1",
      prodName: "prod1",
      prod: { title: "Producer 1", imageUrl: "https://example.com/p1.png" },
      artikuls: { "ART-1": { quantity: 10 } },
    });
    const result = await getAllDelsUtil();
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("title", "Поставка 1");
    expect(result[0]).toHaveProperty("prodName", "prod1");
    expect(result[0]).toHaveProperty("createdAt");
    expect(result[0]).toHaveProperty("updatedAt");
    expect(result[0]).toHaveProperty("_id");
    expect(result[0]).not.toHaveProperty("artikuls");
    expect(result[0].prod).toEqual({
      title: "Producer 1",
      imageUrl: "https://example.com/p1.png",
    });
  });

  it("returns multiple dels sorted by createdAt desc", async () => {
    await Del.create({
      title: "First",
      prodName: "prod1",
      prod: { title: "P1", imageUrl: "https://example.com/p1.png" },
      artikuls: {},
    });
    await Del.create({
      title: "Second",
      prodName: "prod1",
      prod: { title: "P1", imageUrl: "https://example.com/p1.png" },
      artikuls: {},
    });
    const result = await getAllDelsUtil();
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Second");
    expect(result[1].title).toBe("First");
  });
});
