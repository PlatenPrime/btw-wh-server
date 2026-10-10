import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup.js";
import { SkuSliceMonth } from "../../models/SkuSliceMonth.js";
import {
  findDayPointsPage,
  getDayPoint,
  getPointsForSkuRange,
  isDayPointFilled,
  loadDayMapForKonk,
  loadDayMapsForKonkDates,
  loadDayPointsForProductIds,
  loadPointsForSkusRange,
  upsertDayPoint,
  upsertDayPointsBulk,
  upsertDayStockOnly,
} from "../skuSliceMonthStore.js";

describe("skuSliceMonthStore", () => {
  beforeEach(async () => {
    await SkuSliceMonth.deleteMany({});
  });

  it("upsertDayPoint writes and getDayPoint reads", async () => {
    const date = new Date("2026-10-09T00:00:00.000Z");
    await upsertDayPoint("air", "air-1", date, { stock: 10, price: 5 });
    expect(await getDayPoint("air", "air-1", date)).toEqual({
      stock: 10,
      price: 5,
    });
    expect(await getDayPoint("air", "missing", date)).toBeNull();
  });

  it("upsertDayPointsBulk overwrites existing day keys", async () => {
    const date = new Date("2026-10-09T00:00:00.000Z");
    await upsertDayPoint("air", "air-1", date, { stock: 1, price: 1 });
    await upsertDayPointsBulk([
      {
        konkName: "air",
        productId: "air-1",
        date,
        stock: 99,
        price: 7,
      },
      {
        konkName: "air",
        productId: "air-2",
        date,
        stock: -1,
        price: -1,
      },
    ]);
    expect(await getDayPoint("air", "air-1", date)).toEqual({
      stock: 99,
      price: 7,
    });
    expect(await getDayPoint("air", "air-2", date)).toEqual({
      stock: -1,
      price: -1,
    });
  });

  it("getPointsForSkuRange returns only days in window across months", async () => {
    await upsertDayPoint("air", "air-1", new Date("2026-09-30T00:00:00.000Z"), {
      stock: 1,
      price: 1,
    });
    await upsertDayPoint("air", "air-1", new Date("2026-10-01T00:00:00.000Z"), {
      stock: 2,
      price: 2,
    });
    await upsertDayPoint("air", "air-1", new Date("2026-10-15T00:00:00.000Z"), {
      stock: 3,
      price: 3,
    });

    const map = await getPointsForSkuRange(
      "air",
      "air-1",
      new Date("2026-10-01T00:00:00.000Z"),
      new Date("2026-10-10T00:00:00.000Z"),
    );
    expect([...map.keys()].sort()).toEqual(["2026-10-01"]);
    expect(map.get("2026-10-01")).toEqual({ stock: 2, price: 2 });
  });

  it("loadDayMapForKonk builds productId map for one day", async () => {
    const date = new Date("2026-10-09T00:00:00.000Z");
    await upsertDayPointsBulk([
      { konkName: "air", productId: "a", date, stock: 1, price: 2 },
      { konkName: "air", productId: "b", date, stock: 3, price: 4 },
      {
        konkName: "air",
        productId: "c",
        date: new Date("2026-10-10T00:00:00.000Z"),
        stock: 9,
        price: 9,
      },
    ]);
    expect(await loadDayMapForKonk("air", date)).toEqual({
      a: { stock: 1, price: 2 },
      b: { stock: 3, price: 4 },
    });
  });

  it("loadDayMapsForKonkDates returns maps keyed by slice day time", async () => {
    const d0 = new Date("2026-10-08T00:00:00.000Z");
    const d1 = new Date("2026-10-09T00:00:00.000Z");
    await upsertDayPoint("balun", "p1", d0, { stock: 10, price: 1 });
    await upsertDayPoint("balun", "p1", d1, { stock: 5, price: 1 });

    const maps = await loadDayMapsForKonkDates("balun", [d0, d1]);
    expect(maps.get(d0.getTime())).toEqual({ p1: { stock: 10, price: 1 } });
    expect(maps.get(d1.getTime())).toEqual({ p1: { stock: 5, price: 1 } });
  });

  it("findDayPointsPage paginates and filters invalid", async () => {
    const date = new Date("2026-10-09T00:00:00.000Z");
    await upsertDayPointsBulk([
      { konkName: "air", productId: "a", date, stock: 1, price: 2 },
      { konkName: "air", productId: "b", date, stock: -1, price: -1 },
      { konkName: "air", productId: "c", date, stock: 5, price: -5 },
    ]);

    const all = await findDayPointsPage({
      konkName: "air",
      date,
      page: 1,
      limit: 10,
    });
    expect(all.total).toBe(3);

    const invalid = await findDayPointsPage({
      konkName: "air",
      date,
      page: 1,
      limit: 10,
      isInvalid: true,
    });
    expect(invalid.total).toBe(2);
    expect(invalid.items.map((i) => i.productId).sort()).toEqual(["b", "c"]);

    const page1 = await findDayPointsPage({
      konkName: "air",
      date,
      page: 1,
      limit: 1,
    });
    expect(page1.items).toHaveLength(1);
    expect(page1.total).toBe(3);
  });

  it("isDayPointFilled and loadDayPointsForProductIds", async () => {
    const date = new Date("2026-10-09T00:00:00.000Z");
    await upsertDayPoint("air", "ok", date, { stock: 1, price: 1 });
    await upsertDayPoint("air", "bad", date, { stock: -1, price: -1 });

    expect(await isDayPointFilled("air", "ok", date)).toBe(true);
    expect(await isDayPointFilled("air", "bad", date)).toBe(false);
    expect(await isDayPointFilled("air", "missing", date)).toBe(false);

    const map = await loadDayPointsForProductIds(
      "air",
      ["ok", "bad", "missing"],
      date,
    );
    expect(map).toEqual({
      ok: { stock: 1, price: 1 },
      bad: { stock: -1, price: -1 },
    });
  });

  it("loadPointsForSkusRange and upsertDayStockOnly", async () => {
    const d0 = new Date("2026-10-08T00:00:00.000Z");
    const d1 = new Date("2026-10-09T00:00:00.000Z");
    await upsertDayPoint("air", "a1", d0, { stock: 10, price: 2 });
    await upsertDayPoint("sharik", "s1", d1, { stock: 3, price: 4 });

    const rows = await loadPointsForSkusRange(
      [
        { konkName: "air", productId: "a1" },
        { konkName: "sharik", productId: "s1" },
      ],
      d0,
      d1,
    );
    expect(rows).toHaveLength(2);

    const ok = await upsertDayStockOnly("air", "a1", d0, 7);
    expect(ok).toBe(true);
    expect(await getDayPoint("air", "a1", d0)).toEqual({ stock: 7, price: 2 });
    expect(await upsertDayStockOnly("air", "missing", d0, 1)).toBe(false);
  });
});
