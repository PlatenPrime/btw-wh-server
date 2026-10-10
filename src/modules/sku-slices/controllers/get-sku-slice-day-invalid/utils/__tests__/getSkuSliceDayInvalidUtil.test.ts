import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../../test/setup.js";
import { Sku } from "../../../../../skus/models/Sku.js";
import { SkuSliceMonth } from "../../../../models/SkuSliceMonth.js";
import { seedSkuSliceMonthDay } from "../../../../utils/seedSkuSliceMonthDay.js";
import { getSkuSliceDayInvalidUtil } from "../getSkuSliceDayInvalidUtil.js";

describe("getSkuSliceDayInvalidUtil", () => {
  beforeEach(async () => {
    await SkuSliceMonth.deleteMany({});
    await Sku.deleteMany({});
  });

  it("returns only invalid points with sku join", async () => {
    const date = new Date("2026-10-09T00:00:00.000Z");
    await Sku.create({
      konkName: "air",
      prodName: "p",
      productId: "bad",
      title: "Bad",
      url: "https://x.test/b",
      imageUrl: "",
      btradeAnalog: "",
    });
    await seedSkuSliceMonthDay("air", date, {
      ok: { stock: 1, price: 2 },
      bad: { stock: -1, price: -1 },
    });

    const result = await getSkuSliceDayInvalidUtil({
      konkName: "air",
      date,
      page: 1,
      limit: 10,
    });
    expect(result.pagination.total).toBe(1);
    expect(result.items[0]?.productId).toBe("bad");
    expect(result.items[0]?.sku?.title).toBe("Bad");
  });
});
