import { beforeEach, describe, expect, it, vi } from "vitest";
import { toOpenKyivSliceDate, toSliceDate } from "../../../../../../utils/sliceDate.js";
import { putAirClientSkuSliceUtil } from "../putAirClientSkuSliceUtil.js";

vi.mock(
  "../../../../../browser/air/utils/air-product-page-from-html/readAirProductFromHtml.js",
  () => ({
    readAirProductFromHtml: vi.fn(),
  }),
);
vi.mock("../../../../../skus/models/Sku.js", () => ({
  Sku: { findById: vi.fn() },
}));
vi.mock("../../../../../skugrs/models/Skugr.js", () => ({
  Skugr: { exists: vi.fn() },
}));
vi.mock("../../../../utils/skuSliceMonthStore.js", () => ({
  getDayPoint: vi.fn(),
  upsertDayPoint: vi.fn(),
}));
vi.mock("../../../../utils/skuSliceDayMetaStore.js", () => ({
  ensureSkuSliceDayMeta: vi.fn(),
}));
vi.mock("../../../../../sku-reporting/utils/scheduleAfterSkuSliceStockMutation.js", () => ({
  scheduleAfterSkuSliceStockMutation: vi.fn(),
}));
vi.mock("../../../../../skus/utils/maybeSetSkuArtikulIfEmpty.js", () => ({
  maybeSetSkuArtikulIfEmpty: vi.fn(),
}));

import { readAirProductFromHtml } from "../../../../../browser/air/utils/air-product-page-from-html/readAirProductFromHtml.js";
import { Sku } from "../../../../../skus/models/Sku.js";
import { maybeSetSkuArtikulIfEmpty } from "../../../../../skus/utils/maybeSetSkuArtikulIfEmpty.js";
import { Skugr } from "../../../../../skugrs/models/Skugr.js";
import { getDayPoint, upsertDayPoint } from "../../../../utils/skuSliceMonthStore.js";
import { ensureSkuSliceDayMeta } from "../../../../utils/skuSliceDayMetaStore.js";
import { scheduleAfterSkuSliceStockMutation } from "../../../../../sku-reporting/utils/scheduleAfterSkuSliceStockMutation.js";

describe("putAirClientSkuSliceUtil", () => {
  const now = new Date("2026-07-26T12:00:00.000Z");
  const sliceDate = toSliceDate(now);
  const skuId = "507f1f77bcf86cd799439011";
  const input = {
    skuId,
    sourceUrl: "https://airballoons.com.ua/ua/product/x",
    html: "<html>ok</html>",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Sku.findById).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: skuId,
          konkName: "air",
          productId: "air-1",
          url: "https://airballoons.com.ua/ua/product/x",
        }),
      }),
    } as never);
    vi.mocked(Skugr.exists).mockResolvedValue({ _id: "g1" } as never);
    vi.mocked(readAirProductFromHtml).mockReturnValue({
      stock: 12,
      price: 2.1,
      artikul: "SDR-120",
    });
    vi.mocked(maybeSetSkuArtikulIfEmpty).mockResolvedValue(undefined);
    vi.mocked(ensureSkuSliceDayMeta).mockResolvedValue(undefined);
    vi.mocked(getDayPoint).mockResolvedValue(null);
    vi.mocked(upsertDayPoint).mockResolvedValue(undefined);
  });

  it("returns SKU_NOT_FOUND", async () => {
    vi.mocked(Sku.findById).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      }),
    } as never);

    const result = await putAirClientSkuSliceUtil(input, now);
    expect(result).toEqual({
      ok: false,
      code: "SKU_NOT_FOUND",
      message: "Sku not found",
    });
  });

  it("returns NOT_AIR for other competitor", async () => {
    vi.mocked(Sku.findById).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: skuId,
          konkName: "balun",
          productId: "balun-1",
          url: input.sourceUrl,
        }),
      }),
    } as never);

    const result = await putAirClientSkuSliceUtil(input, now);
    expect(result).toMatchObject({ ok: false, code: "NOT_AIR" });
  });

  it("returns NOT_SLICED when sku not in sliced group", async () => {
    vi.mocked(Skugr.exists).mockResolvedValue(null);

    const result = await putAirClientSkuSliceUtil(input, now);
    expect(result).toMatchObject({ ok: false, code: "NOT_SLICED" });
  });

  it("returns URL_MISMATCH", async () => {
    const result = await putAirClientSkuSliceUtil(
      { ...input, sourceUrl: "https://airballoons.com.ua/ua/product/other" },
      now,
    );
    expect(result).toMatchObject({ ok: false, code: "URL_MISMATCH" });
  });

  it("returns PARSE_FAILED for -1/-1", async () => {
    vi.mocked(readAirProductFromHtml).mockReturnValue({
      stock: -1,
      price: -1,
    });

    const result = await putAirClientSkuSliceUtil(input, now);
    expect(result).toMatchObject({ ok: false, code: "PARSE_FAILED" });
  });

  it("saves when filter matches", async () => {
    const result = await putAirClientSkuSliceUtil(input, now);

    expect(result).toEqual({
      ok: true,
      status: "saved",
      date: sliceDate,
      productId: "air-1",
      stock: 12,
      price: 2.1,
    });
    expect(maybeSetSkuArtikulIfEmpty).toHaveBeenCalledWith(skuId, "SDR-120");
    expect(ensureSkuSliceDayMeta).toHaveBeenCalledWith("air", sliceDate);
    expect(upsertDayPoint).toHaveBeenCalledWith("air", "air-1", sliceDate, {
      stock: 12,
      price: 2.1,
    });
    expect(scheduleAfterSkuSliceStockMutation).toHaveBeenCalledWith({
      konkName: "air",
      dayD: sliceDate,
    });
  });

  it("sets artikul even when slice point already filled (skipped)", async () => {
    vi.mocked(getDayPoint).mockResolvedValue({ stock: 9, price: 1.5 });

    await putAirClientSkuSliceUtil(input, now);

    expect(maybeSetSkuArtikulIfEmpty).toHaveBeenCalledWith(skuId, "SDR-120");
  });

  it("skips when valid value already exists", async () => {
    vi.mocked(getDayPoint).mockResolvedValue({ stock: 9, price: 1.5 });

    const result = await putAirClientSkuSliceUtil(input, now);

    expect(result).toEqual({
      ok: true,
      status: "skipped",
      date: sliceDate,
      productId: "air-1",
      stock: 9,
      price: 1.5,
    });
    expect(upsertDayPoint).not.toHaveBeenCalled();
    expect(scheduleAfterSkuSliceStockMutation).not.toHaveBeenCalled();
  });

  it("from 20:00 Kyiv writes the next calendar day", async () => {
    const evening = new Date("2026-07-26T17:00:00.000Z");
    const nextDay = toOpenKyivSliceDate(evening);

    const result = await putAirClientSkuSliceUtil(input, evening);

    expect(nextDay.toISOString()).toBe("2026-07-27T00:00:00.000Z");
    expect(result).toMatchObject({ ok: true, status: "saved", date: nextDay });
    expect(upsertDayPoint).toHaveBeenCalledWith("air", "air-1", nextDay, {
      stock: 12,
      price: 2.1,
    });
    expect(ensureSkuSliceDayMeta).toHaveBeenCalledWith("air", nextDay);
  });
});
