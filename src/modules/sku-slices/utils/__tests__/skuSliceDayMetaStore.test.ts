import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup.js";
import { SkuSliceDayMeta } from "../../models/SkuSliceDayMeta.js";
import {
  ensureSkuSliceDayMeta,
  getSkuSliceDayMeta,
  upsertSkuSliceDayMeta,
} from "../skuSliceDayMetaStore.js";

describe("skuSliceDayMetaStore", () => {
  beforeEach(async () => {
    await SkuSliceDayMeta.deleteMany({});
  });

  it("upsertSkuSliceDayMeta creates and updates stats", async () => {
    const date = new Date("2026-10-09T12:00:00.000Z");
    const created = await upsertSkuSliceDayMeta({
      konkName: "air",
      date,
      stats: { filled: 1, invalid: 0, errorCount: 0 },
    });
    expect(created.stats?.filled).toBe(1);

    await upsertSkuSliceDayMeta({
      konkName: "air",
      date,
      stats: { filled: 10, invalid: 2, errorCount: 1, abortReason: "origin_blocked" },
      rotationMeta: { cycleDays: 3, dayIndex: 0, dueCount: 50 },
    });

    const doc = await getSkuSliceDayMeta("air", date);
    expect(doc?.stats?.filled).toBe(10);
    expect(doc?.stats?.abortReason).toBe("origin_blocked");
    expect(doc?.rotationMeta?.dueCount).toBe(50);
    expect(doc?.date.toISOString()).toBe("2026-10-09T00:00:00.000Z");
  });

  it("ensureSkuSliceDayMeta is idempotent", async () => {
    const date = new Date("2026-10-09T00:00:00.000Z");
    await ensureSkuSliceDayMeta("air", date);
    await ensureSkuSliceDayMeta("air", date);
    expect(await SkuSliceDayMeta.countDocuments()).toBe(1);
  });

  it("null stats unsets field", async () => {
    const date = new Date("2026-10-09T00:00:00.000Z");
    await upsertSkuSliceDayMeta({
      konkName: "air",
      date,
      stats: { filled: 1, invalid: 0, errorCount: 0 },
    });
    await upsertSkuSliceDayMeta({
      konkName: "air",
      date,
      stats: null,
    });
    const doc = await getSkuSliceDayMeta("air", date);
    expect(doc?.stats).toBeUndefined();
  });
});
