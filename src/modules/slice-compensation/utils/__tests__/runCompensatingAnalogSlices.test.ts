import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../analogs/models/Analog.js", () => ({
  Analog: { findOne: vi.fn() },
}));
vi.mock(
  "../../../analogs/controllers/get-analog-stock/utils/getAnalogStockDataUtil.js",
  () => ({ getAnalogStockDataUtil: vi.fn() })
);
vi.mock("../../../analog-slices/models/AnalogSlice.js", () => ({
  AnalogSlice: { find: vi.fn(), findOneAndUpdate: vi.fn() },
}));
vi.mock("../../../slices/config/excludedCompetitors.js", () => ({
  getExcludedCompetitorSet: vi.fn(),
  normalizeCompetitorName: vi.fn((v: string) => v.trim().toLowerCase()),
}));

import { Analog } from "../../../analogs/models/Analog.js";
import { getAnalogStockDataUtil } from "../../../analogs/controllers/get-analog-stock/utils/getAnalogStockDataUtil.js";
import { AnalogSlice } from "../../../analog-slices/models/AnalogSlice.js";
import { getExcludedCompetitorSet } from "../../../slices/config/excludedCompetitors.js";
import { runCompensatingAnalogSlices } from "../runCompensatingAnalogSlices.js";

describe("runCompensatingAnalogSlices", () => {
  const sliceDate = new Date("2025-03-01T00:00:00.000Z");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getExcludedCompetitorSet).mockReturnValue(new Set());
    vi.mocked(AnalogSlice.findOneAndUpdate).mockResolvedValue({} as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function mockFindLean(docs: unknown[]) {
    vi.mocked(AnalogSlice.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(docs),
      }),
    } as never);
  }

  function mockAnalogFindOne(id: string | null) {
    vi.mocked(Analog.findOne).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(
          id ? { _id: { toString: () => id } } : null
        ),
      }),
    } as never);
  }

  it("skips documents for excluded competitors", async () => {
    vi.mocked(getExcludedCompetitorSet).mockReturnValue(new Set(["air"]));
    mockFindLean([
      {
        konkName: "air",
        data: { ART1: { stock: -1, price: -1 } },
      },
    ]);

    const r = await runCompensatingAnalogSlices(sliceDate);

    expect(r).toEqual({ refetched: 0, updated: 0 });
    expect(getAnalogStockDataUtil).not.toHaveBeenCalled();
  });

  it("does not call findOneAndUpdate when fetch still returns full minus one", async () => {
    mockFindLean([
      {
        konkName: "sharte",
        data: { ART1: { stock: -1, price: -1 } },
      },
    ]);
    mockAnalogFindOne("aid1");
    vi.mocked(getAnalogStockDataUtil).mockResolvedValue({
      stock: -1,
      price: -1,
    });

    const r = await runCompensatingAnalogSlices(sliceDate);

    expect(r).toEqual({ refetched: 1, updated: 0 });
    expect(AnalogSlice.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("updates slice when fetch returns live values", async () => {
    mockFindLean([
      {
        konkName: "sharte",
        data: { ART1: { stock: -1, price: -1 } },
      },
    ]);
    mockAnalogFindOne("aid1");
    vi.mocked(getAnalogStockDataUtil).mockResolvedValue({
      stock: 3,
      price: 99,
    });

    const r = await runCompensatingAnalogSlices(sliceDate);

    expect(r).toEqual({ refetched: 1, updated: 1 });
    expect(AnalogSlice.findOneAndUpdate).toHaveBeenCalledWith(
      { konkName: "sharte", date: sliceDate },
      {
        $set: {
          "data.ART1": { stock: 3, price: 99, artikul: "ART1" },
        },
      }
    );
  });

  it("ignores keys that are not full minus one", async () => {
    mockFindLean([
      {
        konkName: "sharte",
        data: { ART1: { stock: 0, price: -1 } },
      },
    ]);

    const r = await runCompensatingAnalogSlices(sliceDate);

    expect(r).toEqual({ refetched: 0, updated: 0 });
    expect(Analog.findOne).not.toHaveBeenCalled();
  });

  it("applies delay between two queued items", async () => {
    vi.useFakeTimers();
    mockFindLean([
      {
        konkName: "sharte",
        data: {
          A: { stock: -1, price: -1 },
          B: { stock: -1, price: -1 },
        },
      },
    ]);
    vi.mocked(Analog.findOne).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: { toString: () => "x" } }),
      }),
    } as never);
    vi.mocked(getAnalogStockDataUtil).mockResolvedValue({
      stock: 1,
      price: 1,
    });

    const p = runCompensatingAnalogSlices(sliceDate);
    await vi.runAllTimersAsync();
    await p;

    expect(getAnalogStockDataUtil).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
