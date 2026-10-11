import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../../konks/models/Konk.js";
import { seedSkuSliceMonthDay } from "../../../sku-slices/utils/seedSkuSliceMonthDay.js";
import { SkuSliceMonth } from "../../../sku-slices/models/SkuSliceMonth.js";
import { loadSkuSliceSalesComputeContext } from "../loadSkuSliceSalesComputeContext.js";

describe("loadSkuSliceSalesComputeContext", () => {
  beforeEach(async () => {
    await Konk.deleteMany({});
    await SkuSliceMonth.deleteMany({});
  });

  it("returns ok:false for empty sku list", async () => {
    const r = await loadSkuSliceSalesComputeContext(
      [],
      new Date("2026-04-02T00:00:00.000Z"),
      new Date("2026-04-03T00:00:00.000Z"),
    );
    expect(r.ok).toBe(false);
  });

  it("loads maps, dates with warmup and recountDays", async () => {
    const d0 = new Date("2026-04-01T00:00:00.000Z");
    const d1 = new Date("2026-04-02T00:00:00.000Z");
    const d2 = new Date("2026-04-03T00:00:00.000Z");

    await Konk.create({
      name: "ctx-k",
      title: "Ctx",
      url: "https://e.com/k",
      imageUrl: "https://e.com/k.png",
      recountDays: ["2026-04-02"],
    });
    await seedSkuSliceMonthDay("ctx-k", d0, {
      "p-1": { stock: 10, price: 2 },
    });
    await seedSkuSliceMonthDay("ctx-k", d1, {
      "p-1": { stock: 8, price: 2 },
    });
    await seedSkuSliceMonthDay("ctx-k", d2, {
      "p-1": { stock: 6, price: 2 },
    });

    const r = await loadSkuSliceSalesComputeContext(
      [{ konkName: "ctx-k", productId: "p-1" }],
      d1,
      d2,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    expect(r.ctx.datesFull).toHaveLength(3);
    expect(r.ctx.dates).toHaveLength(2);
    expect(r.ctx.indexStart).toBe(1);
    expect(r.ctx.recountDaysByKonk.get("ctx-k")?.has("2026-04-02")).toBe(true);
    expect(r.ctx.maps.get("ctx-k")?.get(d1.getTime())?.["p-1"]).toEqual({
      stock: 8,
      price: 2,
    });
  });
});
