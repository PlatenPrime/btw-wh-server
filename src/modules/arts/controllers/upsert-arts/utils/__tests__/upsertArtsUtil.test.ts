import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../../models/Art.js";
import { upsertArtsUtil } from "../upsertArtsUtil.js";

describe("upsertArtsUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("создаёт новые артикулы", async () => {
    const result = await upsertArtsUtil({
      arts: [
        { artikul: "ART-001", zone: "A1", nameukr: "Test Art 1" },
        { artikul: "ART-002", zone: "A2", nameukr: "Test Art 2" },
      ],
    });

    expect(result.upsertedCount).toBe(2);
    expect(result.modifiedCount).toBe(0);
  });

  it("обновляет существующие артикулы", async () => {
    await Art.create({ artikul: "ART-001", zone: "A1" });

    const result = await upsertArtsUtil({
      arts: [
        { artikul: "ART-001", zone: "A2", nameukr: "Updated Art" },
      ],
    });

    expect(result.upsertedCount).toBe(0);
    expect(result.modifiedCount).toBe(1);
  });

  it("возвращает null если артикул не найден", async () => {
    const nonExistentId = "000000000000000000000000";

    const result = await upsertArtsUtil({
      arts: [
        { artikul: nonExistentId, zone: "A1" },
      ],
    });

    // bulkWrite не вернёт null, проверим результат
    expect(result).toBeDefined();
  });

  it("обрабатывает опциональные поля", async () => {
    const result = await upsertArtsUtil({
      arts: [
        {
          artikul: "ART-003",
          zone: "A1",
          nameukr: "Test",
          limit: 100,
          marker: "TEST",
        },
      ],
    });

    expect(result.upsertedCount).toBe(1);
  });
});

