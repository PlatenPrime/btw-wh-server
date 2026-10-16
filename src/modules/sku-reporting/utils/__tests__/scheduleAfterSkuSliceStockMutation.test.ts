import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  flushScheduledSkuSliceStockMutations,
  resetScheduledSkuSliceStockMutationsForTests,
  scheduleAfterSkuSliceStockMutation,
  setScheduledSkuSliceStockMutationRunnerForTests,
} from "../scheduleAfterSkuSliceStockMutation.js";

describe("scheduleAfterSkuSliceStockMutation", () => {
  const dayD = new Date("2026-10-16T00:00:00.000Z");

  beforeEach(() => {
    resetScheduledSkuSliceStockMutationsForTests();
  });

  afterEach(() => {
    resetScheduledSkuSliceStockMutationsForTests();
  });

  it("coalesces many schedules while one run is in flight into one trailing run", async () => {
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const runner = vi.fn().mockImplementation(async () => {
      if (runner.mock.calls.length === 1) {
        await firstGate;
      }
    });
    setScheduledSkuSliceStockMutationRunnerForTests(runner);

    scheduleAfterSkuSliceStockMutation({ konkName: "air", dayD });
    await Promise.resolve();
    expect(runner).toHaveBeenCalledTimes(1);

    scheduleAfterSkuSliceStockMutation({ konkName: "air", dayD });
    scheduleAfterSkuSliceStockMutation({ konkName: "air", dayD });
    scheduleAfterSkuSliceStockMutation({ konkName: "air", dayD });
    expect(runner).toHaveBeenCalledTimes(1);

    releaseFirst();
    await flushScheduledSkuSliceStockMutations();

    expect(runner).toHaveBeenCalledTimes(2);
    expect(runner).toHaveBeenNthCalledWith(1, {
      konkName: "air",
      dayD,
    });
    expect(runner).toHaveBeenNthCalledWith(2, {
      konkName: "air",
      dayD,
    });
  });

  it("isolates slots by konk and day", async () => {
    const runner = vi.fn().mockResolvedValue(undefined);
    setScheduledSkuSliceStockMutationRunnerForTests(runner);

    const dayOther = new Date("2026-10-17T00:00:00.000Z");
    scheduleAfterSkuSliceStockMutation({ konkName: "air", dayD });
    scheduleAfterSkuSliceStockMutation({ konkName: "balun", dayD });
    scheduleAfterSkuSliceStockMutation({ konkName: "air", dayD: dayOther });

    await flushScheduledSkuSliceStockMutations();

    expect(runner).toHaveBeenCalledTimes(3);
    expect(runner).toHaveBeenCalledWith({ konkName: "air", dayD });
    expect(runner).toHaveBeenCalledWith({ konkName: "balun", dayD });
    expect(runner).toHaveBeenCalledWith({
      konkName: "air",
      dayD: dayOther,
    });
  });

  it("does not infinite-loop when runner fails without new schedules", async () => {
    const runner = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValue(undefined);
    setScheduledSkuSliceStockMutationRunnerForTests(runner);

    scheduleAfterSkuSliceStockMutation({ konkName: "air", dayD });
    await flushScheduledSkuSliceStockMutations();

    expect(runner).toHaveBeenCalledTimes(1);

    scheduleAfterSkuSliceStockMutation({ konkName: "air", dayD });
    await flushScheduledSkuSliceStockMutations();
    expect(runner).toHaveBeenCalledTimes(2);
  });

  it("ignores empty konkName", async () => {
    const runner = vi.fn().mockResolvedValue(undefined);
    setScheduledSkuSliceStockMutationRunnerForTests(runner);

    scheduleAfterSkuSliceStockMutation({ konkName: "  ", dayD });
    await flushScheduledSkuSliceStockMutations();

    expect(runner).not.toHaveBeenCalled();
  });
});
