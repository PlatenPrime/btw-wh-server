import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../utils/delay.js", () => ({
  delay: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../../../utils/jitterMs.js", () => ({
  jitterMs: vi.fn(() => 100),
}));

import { delay } from "../../../../utils/delay.js";
import { jitterMs } from "../../../../utils/jitterMs.js";
import {
  buildCompensatingDataKeyQueue,
  runCompensatingSliceRefetchLoop,
} from "../compensatingSliceRunner.js";

describe("buildCompensatingDataKeyQueue", () => {
  const excluded = new Set(["yumi"]);
  const shouldInclude = (item: unknown) =>
    typeof item === "object" &&
    item !== null &&
    (item as { stock?: number }).stock === -1;

  it("queues data keys for included items", () => {
    const queue = buildCompensatingDataKeyQueue(
      [
        {
          konkName: "air",
          data: {
            P1: { stock: -1, price: -1 },
            P2: { stock: 5, price: 10 },
          },
        },
      ],
      excluded,
      shouldInclude
    );

    expect(queue).toEqual([{ konkName: "air", dataKey: "P1" }]);
  });

  it("skips excluded competitors (normalized)", () => {
    const queue = buildCompensatingDataKeyQueue(
      [
        {
          konkName: " Yumi ",
          data: { P1: { stock: -1, price: -1 } },
        },
        {
          konkName: "air",
          data: { P2: { stock: -1, price: -1 } },
        },
      ],
      excluded,
      shouldInclude
    );

    expect(queue).toEqual([{ konkName: "air", dataKey: "P2" }]);
  });

  it("handles missing konkName and data", () => {
    const queue = buildCompensatingDataKeyQueue(
      [{ konkName: undefined as unknown as string, data: undefined }],
      excluded,
      () => true
    );

    expect(queue).toEqual([]);
  });

  it("returns empty queue for empty docs", () => {
    expect(buildCompensatingDataKeyQueue([], excluded, shouldInclude)).toEqual(
      []
    );
  });
});

describe("runCompensatingSliceRefetchLoop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns zero stats for empty queue", async () => {
    const processItem = vi.fn();

    const stats = await runCompensatingSliceRefetchLoop([], processItem);

    expect(stats).toEqual({ refetched: 0, updated: 0 });
    expect(processItem).not.toHaveBeenCalled();
    expect(delay).not.toHaveBeenCalled();
  });

  it("aggregates stats from processItem", async () => {
    const processItem = vi
      .fn()
      .mockResolvedValueOnce({ refetched: 1, updated: 0 })
      .mockResolvedValueOnce({ refetched: 1, updated: 1 });

    const queue = [
      { konkName: "air", dataKey: "P1" },
      { konkName: "air", dataKey: "P2" },
    ];
    const stats = await runCompensatingSliceRefetchLoop(queue, processItem);

    expect(stats).toEqual({ refetched: 2, updated: 1 });
    expect(processItem).toHaveBeenCalledTimes(2);
    expect(processItem).toHaveBeenNthCalledWith(1, queue[0]);
    expect(processItem).toHaveBeenNthCalledWith(2, queue[1]);
  });

  it("delays between items but not after the last", async () => {
    const processItem = vi.fn().mockResolvedValue({ refetched: 0, updated: 0 });
    const queue = [
      { konkName: "a", dataKey: "1" },
      { konkName: "a", dataKey: "2" },
      { konkName: "a", dataKey: "3" },
    ];

    await runCompensatingSliceRefetchLoop(queue, processItem, 10, 20);

    expect(delay).toHaveBeenCalledTimes(2);
    expect(jitterMs).toHaveBeenCalledWith(10, 20);
    expect(vi.mocked(delay).mock.calls[0]![0]).toBe(100);
  });

  it("does not delay for single-item queue", async () => {
    const processItem = vi.fn().mockResolvedValue({ refetched: 1, updated: 0 });

    await runCompensatingSliceRefetchLoop(
      [{ konkName: "air", dataKey: "P1" }],
      processItem
    );

    expect(processItem).toHaveBeenCalledTimes(1);
    expect(delay).not.toHaveBeenCalled();
  });
});
