import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runAnalogSliceForKonkUtil, toSliceDate } from "../runAnalogSliceForKonkUtil.js";

vi.mock("../../../analogs/models/Analog.js", () => ({
  Analog: {
    find: vi.fn(),
  },
}));
vi.mock("../../../analogs/controllers/get-analog-stock/utils/getAnalogStockDataUtil.js", () => ({
  getAnalogStockDataUtil: vi.fn(),
}));
vi.mock("../../models/AnalogSlice.js", () => ({
  AnalogSlice: {
    findOneAndUpdate: vi.fn(),
  },
}));

import { Analog } from "../../../analogs/models/Analog.js";
import { getAnalogStockDataUtil } from "../../../analogs/controllers/get-analog-stock/utils/getAnalogStockDataUtil.js";
import { AnalogSlice } from "../../models/AnalogSlice.js";

describe("runAnalogSliceForKonkUtil", () => {
  const sliceDate = toSliceDate(new Date("2025-03-01T12:00:00.000Z"));

  beforeEach(() => {
    vi.mocked(AnalogSlice.findOneAndUpdate).mockResolvedValue({} as any);
    vi.mocked(Analog.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: { toString: () => "id1" } },
          { _id: { toString: () => "id2" } },
        ]),
      }),
    } as any);
    vi.mocked(getAnalogStockDataUtil)
      .mockResolvedValueOnce({ stock: 10, price: 100 })
      .mockResolvedValueOnce({ stock: 5, price: 200 });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it(
    "creates slice document first with empty data then fills data per analog",
    async () => {
      vi.useFakeTimers();
      vi.mocked(Analog.find).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { _id: { toString: () => "id1" } },
            { _id: { toString: () => "id2" } },
          ]),
        }),
      } as any);
      vi.mocked(getAnalogStockDataUtil)
        .mockResolvedValueOnce({ stock: 10, price: 100 })
        .mockResolvedValueOnce({ stock: 5, price: 200 });

      const resultPromise = runAnalogSliceForKonkUtil("air", new Date("2025-03-01T12:00:00.000Z"));
      await vi.runAllTimersAsync();
      const result = await resultPromise;
      vi.useRealTimers();

      expect(result).toEqual({ saved: true, count: 2 });

      expect(AnalogSlice.findOneAndUpdate).toHaveBeenCalledTimes(3);
      const calls = vi.mocked(AnalogSlice.findOneAndUpdate).mock.calls;

      expect(calls[0][0]).toEqual({ konkName: "air", date: sliceDate });
      expect(calls[0][1]).toEqual({
        $setOnInsert: { konkName: "air", date: sliceDate, data: {} },
      });
      expect(calls[0][2]).toEqual({ upsert: true });

      expect(calls[1][0]).toEqual({ konkName: "air", date: sliceDate });
      expect(calls[1][1]).toEqual({
        $set: { "data.id1": { stock: 10, price: 100 } },
      });

      expect(calls[2][0]).toEqual({ konkName: "air", date: sliceDate });
      expect(calls[2][1]).toEqual({
        $set: { "data.id2": { stock: 5, price: 200 } },
      });
    },
    10000
  );

  it("when no analogs exist only initial upsert is called", async () => {
    vi.mocked(Analog.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      }),
    } as any);

    const result = await runAnalogSliceForKonkUtil("balun", new Date("2025-03-02T00:00:00.000Z"));

    expect(result).toEqual({ saved: true, count: 0 });
    expect(AnalogSlice.findOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(AnalogSlice.findOneAndUpdate).toHaveBeenCalledWith(
      { konkName: "balun", date: toSliceDate(new Date("2025-03-02T00:00:00.000Z")) },
      { $setOnInsert: { konkName: "balun", date: toSliceDate(new Date("2025-03-02T00:00:00.000Z")), data: {} } },
      { upsert: true }
    );
  });

  it("skips adding to data when getAnalogStockDataUtil returns null and continues", async () => {
    vi.mocked(Analog.find).mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([{ _id: { toString: () => "id1" } }]),
      }),
    } as any);
    vi.mocked(getAnalogStockDataUtil).mockReset();
    vi.mocked(getAnalogStockDataUtil).mockResolvedValue(null);

    const result = await runAnalogSliceForKonkUtil("air", new Date("2025-03-01"));

    expect(result).toEqual({ saved: true, count: 0 });
    expect(AnalogSlice.findOneAndUpdate).toHaveBeenCalledTimes(1);
  });
});

describe("toSliceDate", () => {
  it("normalizes date to start of day UTC", () => {
    const d = new Date("2025-03-01T15:30:00.000Z");
    expect(toSliceDate(d).toISOString()).toBe("2025-03-01T00:00:00.000Z");
  });
});
