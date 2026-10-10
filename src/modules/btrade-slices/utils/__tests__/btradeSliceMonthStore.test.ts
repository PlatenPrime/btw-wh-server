import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup.js";
import { BtradeSliceMonth } from "../../models/BtradeSliceMonth.js";
import {
  findDayPointsPage,
  getDayPoint,
  loadDayMap,
  loadDayMaps,
  loadPointsForArtikulsRange,
  upsertDayPoint,
  upsertDayPointsBulk,
} from "../btradeSliceMonthStore.js";

describe("btradeSliceMonthStore", () => {
  beforeEach(async () => {
    await BtradeSliceMonth.deleteMany({});
  });

  it("upsertDayPoint writes and getDayPoint reads", async () => {
    const date = new Date("2026-10-09T00:00:00.000Z");
    await upsertDayPoint("ART-1", date, { quantity: 10, price: 5 });
    expect(await getDayPoint("ART-1", date)).toEqual({
      quantity: 10,
      price: 5,
    });
    expect(await getDayPoint("missing", date)).toBeNull();
  });

  it("upsertDayPointsBulk overwrites existing day keys", async () => {
    const date = new Date("2026-10-09T00:00:00.000Z");
    await upsertDayPoint("ART-1", date, { quantity: 1, price: 1 });
    await upsertDayPointsBulk([
      { artikul: "ART-1", date, quantity: 99, price: 7 },
      { artikul: "ART-2", date, quantity: -1, price: -1 },
    ]);
    expect(await getDayPoint("ART-1", date)).toEqual({
      quantity: 99,
      price: 7,
    });
    expect(await getDayPoint("ART-2", date)).toEqual({
      quantity: -1,
      price: -1,
    });
  });

  it("loadDayMap returns artikul map for day", async () => {
    const date = new Date("2026-10-09T00:00:00.000Z");
    await upsertDayPointsBulk([
      { artikul: "A", date, quantity: 1, price: 2 },
      { artikul: "B", date, quantity: 3, price: 4 },
    ]);
    expect(await loadDayMap(date)).toEqual({
      A: { quantity: 1, price: 2 },
      B: { quantity: 3, price: 4 },
    });
  });

  it("loadDayMaps and loadPointsForArtikulsRange span months", async () => {
    await upsertDayPoint("A", new Date("2026-09-30T00:00:00.000Z"), {
      quantity: 1,
      price: 1,
    });
    await upsertDayPoint("A", new Date("2026-10-01T00:00:00.000Z"), {
      quantity: 2,
      price: 2,
    });
    await upsertDayPoint("B", new Date("2026-10-01T00:00:00.000Z"), {
      quantity: 9,
      price: 9,
    });

    const maps = await loadDayMaps([
      new Date("2026-09-30T00:00:00.000Z"),
      new Date("2026-10-01T00:00:00.000Z"),
    ]);
    expect(maps.get(Date.parse("2026-09-30T00:00:00.000Z"))).toEqual({
      A: { quantity: 1, price: 1 },
    });
    expect(maps.get(Date.parse("2026-10-01T00:00:00.000Z"))).toEqual({
      A: { quantity: 2, price: 2 },
      B: { quantity: 9, price: 9 },
    });

    const points = await loadPointsForArtikulsRange(
      ["A"],
      new Date("2026-10-01T00:00:00.000Z"),
      new Date("2026-10-01T00:00:00.000Z"),
    );
    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({
      artikul: "A",
      item: { quantity: 2, price: 2 },
    });
  });

  it("findDayPointsPage paginates and filters invalid", async () => {
    const date = new Date("2026-10-09T00:00:00.000Z");
    await upsertDayPointsBulk([
      { artikul: "A", date, quantity: 10, price: 1 },
      { artikul: "B", date, quantity: -1, price: -1 },
      { artikul: "C", date, quantity: 5, price: 2 },
    ]);

    const all = await findDayPointsPage({ date, page: 1, limit: 2 });
    expect(all.total).toBe(3);
    expect(all.items.map((i) => i.artikul)).toEqual(["A", "B"]);

    const invalid = await findDayPointsPage({
      date,
      page: 1,
      limit: 10,
      isInvalid: true,
    });
    expect(invalid.total).toBe(1);
    expect(invalid.items[0]?.artikul).toBe("B");
  });
});
