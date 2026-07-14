import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../runCompensatingAnalogSlices.js", () => ({
  runCompensatingAnalogSlices: vi.fn(),
}));
vi.mock("../runCompensatingSkuSlices.js", () => ({
  runCompensatingSkuSlices: vi.fn(),
}));
vi.mock("../../../../utils/sliceDate.js", () => ({
  toSliceDate: vi.fn(() => new Date("2026-07-14T00:00:00.000Z")),
}));

import { runCompensatingAnalogSlices } from "../runCompensatingAnalogSlices.js";
import { runCompensatingSkuSlices } from "../runCompensatingSkuSlices.js";
import { runCompensatingSlicesForKonk } from "../runCompensatingSlicesForKonk.js";

describe("runCompensatingSlicesForKonk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(runCompensatingAnalogSlices).mockResolvedValue({
      refetched: 1,
      updated: 1,
    });
    vi.mocked(runCompensatingSkuSlices).mockResolvedValue({
      refetched: 2,
      updated: 0,
    });
  });

  it("normalizes konkName and runs analog+sku for today", async () => {
    const result = await runCompensatingSlicesForKonk(" Air ");

    expect(result).toEqual({
      konkName: "air",
      sliceDate: new Date("2026-07-14T00:00:00.000Z"),
      analog: { refetched: 1, updated: 1 },
      sku: { refetched: 2, updated: 0 },
    });
    expect(runCompensatingAnalogSlices).toHaveBeenCalledWith(
      new Date("2026-07-14T00:00:00.000Z"),
      { konkName: "air" }
    );
    expect(runCompensatingSkuSlices).toHaveBeenCalledWith(
      new Date("2026-07-14T00:00:00.000Z"),
      { konkName: "air" }
    );
  });
});
