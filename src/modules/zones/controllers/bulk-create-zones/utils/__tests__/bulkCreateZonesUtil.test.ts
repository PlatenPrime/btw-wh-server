import { beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { Zone } from "../../../../models/Zone.js";
import { bulkCreateZonesUtil } from "../bulkCreateZonesUtil.js";

describe("bulkCreateZonesUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("выполняет bulk write операцию upsert для зон", async () => {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const zones = [
        { title: "1-1", bar: 10101, sector: 0 },
        { title: "1-2", bar: 10102, sector: 0 },
        { title: "2-1", bar: 10201, sector: 1 },
      ];

      const result = await bulkCreateZonesUtil({ zones });

      expect(result.modifiedCount).toBeGreaterThanOrEqual(0);
      expect(result.upsertedCount).toBeGreaterThanOrEqual(0);

      // Проверяем что зоны созданы
      const createdZones = await Zone.find({
        bar: { $in: zones.map((z) => z.bar) },
      }).session(session);

      expect(createdZones).toHaveLength(3);
      expect(createdZones.some((z) => z.title === "1-1")).toBe(true);
      expect(createdZones.some((z) => z.title === "1-2")).toBe(true);
      expect(createdZones.some((z) => z.title === "2-1")).toBe(true);
    });
    await session.endSession();
  });

  it("обновляет существующие зоны при повторном bulk write", async () => {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      // Создаём первоначальные зоны
      await Zone.insertMany([
        { title: "1-1", bar: 10101, sector: 0 },
        { title: "1-2", bar: 10102, sector: 0 },
      ]);

      // Выполняем upsert с обновлёнными данными
      const zones = [
        { title: "1-1-updated", bar: 10101, sector: 1 },
        { title: "1-2-updated", bar: 10102, sector: 1 },
      ];

      const result = await bulkCreateZonesUtil({ zones });

      expect(result.modifiedCount).toBe(2);

      // Проверяем что зоны обновлены
      const updatedZones = await Zone.find({
        bar: { $in: [10101, 10102] },
      })
        .sort({ bar: 1 })
        .session(session);

      expect(updatedZones).toHaveLength(2);
      expect(updatedZones[0].title).toBe("1-1-updated");
      expect(updatedZones[0].sector).toBe(1);
      expect(updatedZones[1].title).toBe("1-2-updated");
      expect(updatedZones[1].sector).toBe(1);
    });
    await session.endSession();
  });

  it("обрабатывает пустой массив зон", async () => {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const result = await bulkCreateZonesUtil({ zones: [] });

      expect(result.modifiedCount).toBe(0);
      expect(result.upsertedCount).toBe(0);
    });
    await session.endSession();
  });
});

