import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../utils/delay.js", () => ({
  delay: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../skus/models/Sku.js", () => ({
  Sku: { findOne: vi.fn() },
}));
vi.mock("../../../skus/utils/getSkuStockDataUtil.js", () => ({
  getSkuStockDataUtil: vi.fn(),
  UNSUPPORTED_KONK_CODE: "UNSUPPORTED_KONK",
}));
vi.mock("../../../sku-slices/models/SkuSliceDayMeta.js", () => ({
  SkuSliceDayMeta: { find: vi.fn() },
}));
vi.mock("../../../sku-slices/models/SkuSliceMonth.js", () => ({
  SkuSliceMonth: { distinct: vi.fn() },
}));
vi.mock("../../../sku-slices/utils/skuSliceMonthStore.js", () => ({
  loadDayMapForKonk: vi.fn(),
  upsertDayPoint: vi.fn(),
}));
vi.mock("../../../slices/config/excludedCompetitors.js", () => ({
  getExcludedCompetitorSet: vi.fn(),
  getCompensationExcludedCompetitorSet: vi.fn(),
  normalizeCompetitorName: vi.fn((v: string) => v.trim().toLowerCase()),
}));

const { logModuleInfo, logModuleWarn } = vi.hoisted(() => ({
  logModuleInfo: vi.fn(),
  logModuleWarn: vi.fn(),
}));

vi.mock("../../../../logging/logModuleError.js", () => ({
  logModuleInfo,
  logModuleWarn,
  logModuleError: vi.fn(),
  logModuleDebug: vi.fn(),
}));

vi.mock("../../../sku-reporting/utils/materializeSkuSliceSalesUtil.js", () => ({
  afterSkuSliceStockMutation: vi.fn().mockResolvedValue({}),
}));

import { Sku } from "../../../skus/models/Sku.js";
import {
  getSkuStockDataUtil,
  UNSUPPORTED_KONK_CODE,
} from "../../../skus/utils/getSkuStockDataUtil.js";
import { SkuSliceDayMeta } from "../../../sku-slices/models/SkuSliceDayMeta.js";
import {
  loadDayMapForKonk,
  upsertDayPoint,
} from "../../../sku-slices/utils/skuSliceMonthStore.js";
import { getCompensationExcludedCompetitorSet } from "../../../slices/config/excludedCompetitors.js";
import { runCompensatingSkuSlices } from "../runCompensatingSkuSlices.js";

describe("runCompensatingSkuSlices", () => {
  const sliceDate = new Date("2025-03-01T00:00:00.000Z");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCompensationExcludedCompetitorSet).mockReturnValue(new Set());
    vi.mocked(upsertDayPoint).mockResolvedValue(undefined);
    vi.mocked(SkuSliceDayMeta.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([{ konkName: "air" }]),
      }),
    } as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function mockDayMap(data: Record<string, unknown>) {
    vi.mocked(loadDayMapForKonk).mockResolvedValue(
      data as Record<string, { stock: number; price: number }>,
    );
  }

  function mockSkuFindOne(id: string | null) {
    vi.mocked(Sku.findOne).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(
          id ? { _id: { toString: () => id } } : null,
        ),
      }),
    } as never);
  }

  it("skips excluded competitors", async () => {
    vi.mocked(getCompensationExcludedCompetitorSet).mockReturnValue(
      new Set(["yumi"]),
    );
    vi.mocked(SkuSliceDayMeta.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([{ konkName: "yumi" }]),
      }),
    } as never);
    mockDayMap({ P1: { stock: -1, price: -1 } });

    const r = await runCompensatingSkuSlices(sliceDate);

    expect(r).toEqual({ refetched: 0, updated: 0 });
    expect(getSkuStockDataUtil).not.toHaveBeenCalled();
  });

  it("does not update when fetch still returns -1/-1", async () => {
    mockDayMap({ P1: { stock: -1, price: -1 } });
    mockSkuFindOne("sid1");
    vi.mocked(getSkuStockDataUtil).mockResolvedValue({ stock: -1, price: -1 });

    const r = await runCompensatingSkuSlices(sliceDate);

    expect(r).toEqual({ refetched: 1, updated: 0 });
    expect(upsertDayPoint).not.toHaveBeenCalled();
    expect(logModuleInfo).toHaveBeenCalledWith(
      "slice-compensation",
      "compensating sku refetch result",
      {
        konkName: "air",
        productKey: "P1",
        kind: "sku",
        stock: -1,
        price: -1,
        updated: false,
      },
    );
  });

  it("updates when fetch returns non-full-minus", async () => {
    mockDayMap({ P1: { stock: -1, price: -1 } });
    mockSkuFindOne("sid1");
    vi.mocked(getSkuStockDataUtil).mockResolvedValue({ stock: 5, price: -1 });

    const r = await runCompensatingSkuSlices(sliceDate);

    expect(r).toEqual({ refetched: 1, updated: 1 });
    expect(upsertDayPoint).toHaveBeenCalledWith("air", "P1", sliceDate, {
      stock: 5,
      price: -1,
    });
    expect(logModuleInfo).toHaveBeenCalledWith(
      "slice-compensation",
      "compensating sku refetch result",
      {
        konkName: "air",
        productKey: "P1",
        kind: "sku",
        stock: 5,
        price: -1,
        updated: true,
      },
    );
  });

  it("logs empty when stock util returns null", async () => {
    mockDayMap({ P1: { stock: -1, price: -1 } });
    mockSkuFindOne("sid1");
    vi.mocked(getSkuStockDataUtil).mockResolvedValue(null);

    const r = await runCompensatingSkuSlices(sliceDate);

    expect(r).toEqual({ refetched: 0, updated: 0 });
    expect(logModuleInfo).toHaveBeenCalledWith(
      "slice-compensation",
      "compensating sku refetch empty",
      { konkName: "air", productKey: "P1", kind: "sku" },
    );
  });

  it("logs warn when sku entity is missing", async () => {
    mockDayMap({ P1: { stock: -1, price: -1 } });
    mockSkuFindOne(null);

    const r = await runCompensatingSkuSlices(sliceDate);

    expect(r).toEqual({ refetched: 0, updated: 0 });
    expect(logModuleWarn).toHaveBeenCalled();
  });

  it("skips unsupported konk errors", async () => {
    mockDayMap({ P1: { stock: -1, price: -1 } });
    mockSkuFindOne("sid1");
    const err = Object.assign(new Error("nope"), {
      code: UNSUPPORTED_KONK_CODE,
    });
    vi.mocked(getSkuStockDataUtil).mockRejectedValue(err);

    const r = await runCompensatingSkuSlices(sliceDate);
    expect(r).toEqual({ refetched: 0, updated: 0 });
    expect(logModuleWarn).toHaveBeenCalled();
  });

  it("filters by konkName option", async () => {
    vi.mocked(SkuSliceDayMeta.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { konkName: "air" },
          { konkName: "balun" },
        ]),
      }),
    } as never);
    mockDayMap({ P1: { stock: -1, price: -1 } });
    mockSkuFindOne("sid1");
    vi.mocked(getSkuStockDataUtil).mockResolvedValue({ stock: 1, price: 2 });

    await runCompensatingSkuSlices(sliceDate, { konkName: "air" });

    expect(loadDayMapForKonk).toHaveBeenCalledWith("air", sliceDate);
    expect(loadDayMapForKonk).toHaveBeenCalledTimes(1);
  });
});
