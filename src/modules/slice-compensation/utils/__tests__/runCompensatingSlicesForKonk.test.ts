import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../runCompensatingSkuSlices.js", () => ({
  runCompensatingSkuSlices: vi.fn(),
}));
vi.mock("../../../../utils/sliceDate.js", () => ({
  toSliceDate: vi.fn(() => new Date("2026-07-14T00:00:00.000Z")),
}));

import { runCompensatingSkuSlices } from "../runCompensatingSkuSlices.js";
import { runCompensatingSlicesForKonk } from "../runCompensatingSlicesForKonk.js";

describe("runCompensatingSlicesForKonk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(runCompensatingSkuSlices).mockResolvedValue({
      refetched: 2,
      updated: 0,
    });
  });

  it("normalizes konkName and runs sku compensation for today", async () => {
    const result = await runCompensatingSlicesForKonk(" Air ");

    expect(result).toEqual({
      konkName: "air",
      sliceDate: new Date("2026-07-14T00:00:00.000Z"),
      sku: { refetched: 2, updated: 0 },
    });
    expect(runCompensatingSkuSlices).toHaveBeenCalledWith(new Date("2026-07-14T00:00:00.000Z"), {
      konkName: "air",
    });
  });
});
