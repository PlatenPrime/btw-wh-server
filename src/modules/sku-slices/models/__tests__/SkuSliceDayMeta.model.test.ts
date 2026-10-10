import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup.js";
import { SkuSliceDayMeta } from "../SkuSliceDayMeta.js";

describe("SkuSliceDayMeta Model", () => {
  beforeEach(async () => {
    await SkuSliceDayMeta.deleteMany({});
  });

  it("requires konkName and date", async () => {
    const missing = new SkuSliceDayMeta({ konkName: "air" });
    await expect(missing.save()).rejects.toThrow();
  });

  it("persists rotationMeta and stats", async () => {
    const date = new Date("2026-10-09T00:00:00.000Z");
    const saved = await SkuSliceDayMeta.create({
      konkName: "air",
      date,
      rotationMeta: { cycleDays: 3, dayIndex: 1, dueCount: 100 },
      stats: {
        filled: 80,
        invalid: 5,
        errorCount: 2,
        dueTotal: 100,
        abortReason: "consecutive_invalid",
      },
    });
    const plain = saved.toObject();
    expect(plain.konkName).toBe("air");
    expect(plain.date.toISOString()).toBe(date.toISOString());
    expect(plain.rotationMeta).toEqual({
      cycleDays: 3,
      dayIndex: 1,
      dueCount: 100,
    });
    expect(plain.stats?.filled).toBe(80);
    expect(plain.stats?.abortReason).toBe("consecutive_invalid");
  });

  it("enforces unique (konkName, date)", async () => {
    const date = new Date("2026-10-09T00:00:00.000Z");
    await SkuSliceDayMeta.create({ konkName: "dup", date });
    await expect(
      SkuSliceDayMeta.create({ konkName: "dup", date }),
    ).rejects.toThrow();
  });
});
