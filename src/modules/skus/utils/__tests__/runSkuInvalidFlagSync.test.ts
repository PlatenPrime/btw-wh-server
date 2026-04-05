import { beforeEach, describe, expect, it } from "vitest";
import { SkuSlice } from "../../../sku-slices/models/SkuSlice.js";
import { Sku } from "../../models/Sku.js";
import { runSkuInvalidFlagSync } from "../runSkuInvalidFlagSync.js";

describe("runSkuInvalidFlagSync", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await SkuSlice.deleteMany({});
  });

  it("sets isInvalid true only when 7 consecutive days have -1/-1 for productId", async () => {
    const ref = new Date("2026-03-10T12:00:00.000Z");
    const windowEnd = new Date("2026-03-09T00:00:00.000Z");
    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(windowEnd);
      d.setUTCDate(d.getUTCDate() - i);
      days.push(d);
    }

    const sku = await Sku.create({
      konkName: "air",
      prodName: "p",
      productId: "air-x",
      title: "T",
      url: "https://example.com/x",
    });

    for (const d of days) {
      await SkuSlice.create({
        konkName: "air",
        date: d,
        data: { "air-x": { stock: -1, price: -1 } },
      });
    }

    await runSkuInvalidFlagSync(ref);
    const fresh = await Sku.findById(sku._id).lean();
    expect(fresh?.isInvalid).toBe(true);
  });

  it("sets isInvalid false when one day in window has no slice doc", async () => {
    const ref = new Date("2026-03-10T12:00:00.000Z");
    const windowEnd = new Date("2026-03-09T00:00:00.000Z");
    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(windowEnd);
      d.setUTCDate(d.getUTCDate() - i);
      days.push(d);
    }

    const sku = await Sku.create({
      konkName: "air",
      prodName: "p",
      productId: "air-y",
      title: "T",
      url: "https://example.com/y",
    });

    for (let i = 0; i < days.length; i++) {
      if (i === 3) continue;
      const d = days[i]!;
      await SkuSlice.create({
        konkName: "air",
        date: d,
        data: { "air-y": { stock: -1, price: -1 } },
      });
    }

    await runSkuInvalidFlagSync(ref);
    const fresh = await Sku.findById(sku._id).lean();
    expect(fresh?.isInvalid).toBe(false);
  });

  it("sets isInvalid false when slice has valid stock", async () => {
    const ref = new Date("2026-03-10T12:00:00.000Z");
    const windowEnd = new Date("2026-03-09T00:00:00.000Z");
    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(windowEnd);
      d.setUTCDate(d.getUTCDate() - i);
      days.push(d);
    }

    const sku = await Sku.create({
      konkName: "air",
      prodName: "p",
      productId: "air-z",
      title: "T",
      url: "https://example.com/z",
    });

    for (let i = 0; i < days.length; i++) {
      const d = days[i]!;
      const bad = i === days.length - 1;
      await SkuSlice.create({
        konkName: "air",
        date: d,
        data: {
          "air-z": bad ? { stock: 5, price: 10 } : { stock: -1, price: -1 },
        },
      });
    }

    await runSkuInvalidFlagSync(ref);
    const fresh = await Sku.findById(sku._id).lean();
    expect(fresh?.isInvalid).toBe(false);
  });
});
