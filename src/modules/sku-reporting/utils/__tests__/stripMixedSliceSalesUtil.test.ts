import { beforeEach, describe, expect, it } from "vitest";
import {
  stripMixedSliceSalesFields,
  stripSalesFieldsFromData,
} from "../stripMixedSliceSalesUtil.js";
import { SkuSlice } from "../../../sku-slices/models/SkuSlice.js";
import { BtradeSlice } from "../../../btrade-slices/models/BtradeSlice.js";

describe("stripMixedSliceSalesUtil", () => {
  beforeEach(async () => {
    await SkuSlice.deleteMany({});
    await BtradeSlice.deleteMany({});
  });

  it("stripSalesFieldsFromData removes salesPcs/salesUah", () => {
    const { next, changed } = stripSalesFieldsFromData({
      a: { stock: 1, price: 2, salesPcs: 3, salesUah: 6 },
      b: { stock: 4, price: 5 },
    });
    expect(changed).toBe(true);
    expect(next.a).toEqual({ stock: 1, price: 2 });
    expect(next.b).toEqual({ stock: 4, price: 5 });
  });

  it("stripSalesFieldsFromData reports unchanged when no sales fields", () => {
    const { changed } = stripSalesFieldsFromData({
      a: { stock: 1, price: 2 },
    });
    expect(changed).toBe(false);
  });

  it("stripMixedSliceSalesFields rewrites SkuSlice and BtradeSlice", async () => {
    const d = new Date("2026-08-01T00:00:00.000Z");
    await SkuSlice.create({
      konkName: "k",
      date: d,
      data: { p1: { stock: 1, price: 2, salesPcs: 9, salesUah: 18 } },
    });
    await BtradeSlice.create({
      date: d,
      data: { art1: { quantity: 3, price: 4, salesPcs: 1, salesUah: 4 } },
    });

    const r = await stripMixedSliceSalesFields({ apply: true });
    expect(r.skuDocsTouched).toBe(1);
    expect(r.btradeDocsTouched).toBe(1);

    const sku = await SkuSlice.findOne({ konkName: "k", date: d }).lean();
    expect(sku?.data.p1).toEqual({ stock: 1, price: 2 });
    const bt = await BtradeSlice.findOne({ date: d }).lean();
    expect(bt?.data.art1).toEqual({ quantity: 3, price: 4 });
  });

  it("dry-run does not write", async () => {
    const d = new Date("2026-08-02T00:00:00.000Z");
    await SkuSlice.create({
      konkName: "k",
      date: d,
      data: { p1: { stock: 1, price: 2, salesPcs: 1, salesUah: 2 } },
    });
    const r = await stripMixedSliceSalesFields({ apply: false });
    expect(r.skuDocsTouched).toBe(1);
    const sku = await SkuSlice.findOne({ konkName: "k", date: d }).lean();
    expect(sku?.data.p1).toMatchObject({ salesPcs: 1, salesUah: 2 });
  });

  it("onProgress reports phase-start and doc events", async () => {
    const d1 = new Date("2026-08-03T00:00:00.000Z");
    const d2 = new Date("2026-08-04T00:00:00.000Z");
    await SkuSlice.insertMany([
      {
        konkName: "k",
        date: d1,
        data: { p1: { stock: 1, price: 2, salesPcs: 1, salesUah: 2 } },
      },
      {
        konkName: "k",
        date: d2,
        data: { p1: { stock: 1, price: 2 } },
      },
    ]);
    await BtradeSlice.create({
      date: d1,
      data: { a: { quantity: 1, price: 1, salesPcs: 0, salesUah: 0 } },
    });

    const events: Array<{
      phase: string;
      event: string;
      scanned: number;
      total: number;
      touched: number;
    }> = [];

    const r = await stripMixedSliceSalesFields({
      apply: true,
      onProgress: (info) => {
        events.push({
          phase: info.phase,
          event: info.event,
          scanned: info.scanned,
          total: info.total,
          touched: info.touched,
        });
      },
    });

    expect(r.skuDocsScanned).toBe(2);
    expect(r.skuDocsTouched).toBe(1);
    expect(r.btradeDocsScanned).toBe(1);
    expect(r.btradeDocsTouched).toBe(1);

    expect(events[0]).toMatchObject({
      phase: "sku",
      event: "phase-start",
      total: 2,
      scanned: 0,
    });
    expect(events.some((e) => e.phase === "sku" && e.event === "doc")).toBe(
      true,
    );
    expect(
      events.some((e) => e.phase === "btrade" && e.event === "phase-start"),
    ).toBe(true);
    expect(
      events.some((e) => e.phase === "btrade" && e.event === "doc" && e.touched === 1),
    ).toBe(true);
  });
});
