import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toSliceDate } from "../../../../../../utils/sliceDate.js";
import {
  getSliceRotationDayIndex,
  isProductDueForSliceRotation,
} from "../../../../../slices/utils/sliceRotation.js";
import { getAirClientPendingUtil } from "../getAirClientPendingUtil.js";

vi.mock("../../../../utils/loadSlicedSkusForKonk.js", () => ({
  loadSlicedSkusForKonk: vi.fn(),
}));
vi.mock("../../../../models/SkuSlice.js", () => ({
  SkuSlice: {
    findOne: vi.fn(),
  },
}));

import { loadSlicedSkusForKonk } from "../../../../utils/loadSlicedSkusForKonk.js";
import { SkuSlice } from "../../../../models/SkuSlice.js";

describe("getAirClientPendingUtil", () => {
  const now = new Date("2026-07-26T12:00:00.000Z");
  const sliceDate = toSliceDate(now);
  const rotationConfig = { cycleDays: 3 };

  function notDueProductId(): string {
    let id = "air-not-due";
    let n = 0;
    while (isProductDueForSliceRotation(id, sliceDate, rotationConfig) && n < 100) {
      id = `air-not-due-${n}`;
      n += 1;
    }
    return id;
  }

  function dueProductId(suffix: string): string {
    let id = `air-${suffix}`;
    let n = 0;
    while (
      !isProductDueForSliceRotation(id, sliceDate, rotationConfig) &&
      n < 100
    ) {
      id = `air-${suffix}-${n}`;
      n += 1;
    }
    return id;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("treats missing slice document as due sliced skus pending", async () => {
    const pid1 = dueProductId("a");
    const pid2 = dueProductId("b");
    vi.mocked(loadSlicedSkusForKonk).mockResolvedValue([
      {
        _id: { toString: () => "s1" },
        productId: pid1,
        title: "One",
        url: "https://airballoons.com.ua/ua/product/1",
      },
      {
        _id: { toString: () => "s2" },
        productId: pid2,
        title: "Two",
        url: "https://airballoons.com.ua/ua/product/2",
      },
      {
        _id: { toString: () => "s3" },
        productId: notDueProductId(),
        title: "Skip",
        url: "https://airballoons.com.ua/ua/product/x",
      },
    ]);
    vi.mocked(SkuSlice.findOne).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      }),
    } as never);

    const result = await getAirClientPendingUtil(now);

    expect(result.date).toEqual(sliceDate);
    expect(result.rotation).toEqual({
      cycleDays: 3,
      dayIndex: getSliceRotationDayIndex(sliceDate, 3),
      dueCount: 2,
    });
    expect(result.items.map((i) => i.productId).sort()).toEqual(
      [pid1, pid2].sort()
    );
  });

  it("includes missing and -1 entries for due bucket only, skips valid ones", async () => {
    const pidValid = dueProductId("valid");
    const pidMinus = dueProductId("minus");
    const pidMissing = dueProductId("missing");
    vi.mocked(loadSlicedSkusForKonk).mockResolvedValue([
      {
        _id: { toString: () => "s1" },
        productId: pidValid,
        title: "Valid",
        url: "https://airballoons.com.ua/ua/product/1",
      },
      {
        _id: { toString: () => "s2" },
        productId: pidMinus,
        title: "Minus",
        url: "https://airballoons.com.ua/ua/product/2",
      },
      {
        _id: { toString: () => "s3" },
        productId: pidMissing,
        title: "Missing",
        url: "https://airballoons.com.ua/ua/product/3",
      },
      {
        _id: { toString: () => "s4" },
        productId: "",
        title: "No pid",
        url: "https://airballoons.com.ua/ua/product/4",
      },
    ]);
    vi.mocked(SkuSlice.findOne).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          data: {
            [pidValid]: { stock: 10, price: 2.1 },
            [pidMinus]: { stock: -1, price: -1 },
          },
        }),
      }),
    } as never);

    const result = await getAirClientPendingUtil(now);

    expect(result.items.map((i) => i.productId)).toEqual([pidMinus, pidMissing]);
  });
});
