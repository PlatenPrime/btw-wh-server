import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../../skus/models/Sku.js";
import { SkuSliceMonth } from "../../../../models/SkuSliceMonth.js";
import { seedSkuSliceMonthDay } from "../../../../utils/seedSkuSliceMonthDay.js";
import { discoverBandSpikeUtil } from "../discoverBandSpikeUtil.js";

const D0 = new Date("2026-09-13T00:00:00.000Z");
const D1 = new Date("2026-09-14T00:00:00.000Z");
const D2 = new Date("2026-09-15T00:00:00.000Z");
const D3 = new Date("2026-09-16T00:00:00.000Z");

describe("discoverBandSpikeUtil", () => {
  beforeEach(async () => {
    await SkuSliceMonth.deleteMany({});
    await Sku.deleteMany({});
  });

  it("returns products that entered band and exited with sku mapping", async () => {
    await Sku.create({
      konkName: "balun",
      prodName: "balun",
      productId: "balun-spike",
      title: "Spike item",
      url: "https://example.com/balun-spike",
      imageUrl: "https://cdn.example/balun-spike.webp",
    });

    await seedSkuSliceMonthDay("balun", D0, {
      "balun-spike": { stock: 5, price: 10 },
      "balun-calm": { stock: 10, price: 10 },
    });
    await seedSkuSliceMonthDay("balun", D1, {
      "balun-spike": { stock: 9937, price: 10 },
      "balun-calm": { stock: 12, price: 10 },
    });
    await seedSkuSliceMonthDay("balun", D2, {
      "balun-spike": { stock: 9937, price: 10 },
      "balun-calm": { stock: 11, price: 10 },
    });
    await seedSkuSliceMonthDay("balun", D3, {
      "balun-spike": { stock: 59, price: 10 },
      "balun-calm": { stock: 10, price: 10 },
    });

    const result = await discoverBandSpikeUtil({
      konkName: "balun",
      stockMin: 9000,
      stockMax: 11000,
      dateFrom: D1,
      dateTo: D2,
    });

    expect(result.band).toEqual({ min: 9000, max: 11000 });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      productId: "balun-spike",
      title: "Spike item",
      imageUrl: "https://cdn.example/balun-spike.webp",
      runs: [{ dateFrom: "2026-09-14", dateTo: "2026-09-15", peakStock: 9937 }],
    });
    expect(result.items[0]!.skuId).toBeTruthy();
  });

  it("includes product without Sku as skuId null", async () => {
    await seedSkuSliceMonthDay("svbum", D0, { orphan: { stock: 100, price: 1 } });
    await seedSkuSliceMonthDay("svbum", D1, { orphan: { stock: 1_200_000, price: 1 } });
    await seedSkuSliceMonthDay("svbum", D2, { orphan: { stock: 80, price: 1 } });

    const result = await discoverBandSpikeUtil({
      konkName: "svbum",
      stockMin: 900_000,
      stockMax: 9_999_999,
      dateFrom: D1,
      dateTo: D1,
    });

    expect(result.items).toEqual([
      {
        skuId: null,
        productId: "orphan",
        title: null,
        imageUrl: null,
        runs: [{ dateFrom: "2026-09-14", dateTo: "2026-09-14", peakStock: 1_200_000 }],
      },
    ]);
  });

  it("returns imageUrl null when Sku imageUrl is empty", async () => {
    await Sku.create({
      konkName: "balun",
      prodName: "balun",
      productId: "balun-blank",
      title: "Blank image",
      url: "https://example.com/balun-blank",
      imageUrl: "",
    });

    await seedSkuSliceMonthDay("balun", D0, {
      "balun-blank": { stock: 5, price: 10 },
    });
    await seedSkuSliceMonthDay("balun", D1, {
      "balun-blank": { stock: 9500, price: 10 },
    });
    await seedSkuSliceMonthDay("balun", D2, {
      "balun-blank": { stock: 20, price: 10 },
    });

    const result = await discoverBandSpikeUtil({
      konkName: "balun",
      stockMin: 9000,
      stockMax: 11000,
      dateFrom: D1,
      dateTo: D1,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      productId: "balun-blank",
      title: "Blank image",
      imageUrl: null,
    });
  });

  it("excludes trailing band without exit", async () => {
    await seedSkuSliceMonthDay("balun", D1, { trail: { stock: 10000, price: 1 } });
    await seedSkuSliceMonthDay("balun", D2, { trail: { stock: 10000, price: 1 } });

    const result = await discoverBandSpikeUtil({
      konkName: "balun",
      stockMin: 9000,
      stockMax: 11000,
      dateFrom: D1,
      dateTo: D2,
    });

    expect(result.items).toEqual([]);
  });
});
