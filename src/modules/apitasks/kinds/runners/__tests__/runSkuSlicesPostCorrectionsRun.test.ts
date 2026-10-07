import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../events/utils/createEventUtil.js", () => ({
  createEventUtil: vi.fn(),
}));
vi.mock(
  "../../../../sku-slices/utils/runSkuSlicePostCorrectionsUtil.js",
  () => ({
    runSkuSlicePostCorrectionsUtil: vi.fn(),
  })
);

import { createEventUtil } from "../../../../events/utils/createEventUtil.js";
import { runSkuSlicePostCorrectionsUtil } from "../../../../sku-slices/utils/runSkuSlicePostCorrectionsUtil.js";
import { runSkuSlicesPostCorrectionsRun } from "../runTier1ApiTaskKinds.js";

describe("runSkuSlicesPostCorrectionsRun", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(runSkuSlicePostCorrectionsUtil).mockResolvedValue({
      apply: true,
      dateFrom: "2026-04-01",
      dateTo: "2026-04-03",
      days: [],
      errors: [],
    });
  });

  it("runs util with parsed params and forwards progress", async () => {
    const onProgress = vi.fn();
    const result = await runSkuSlicesPostCorrectionsRun(
      {
        dateFrom: "2026-04-01",
        dateTo: "2026-04-03",
        apply: true,
      },
      { onProgress, userId: "u1" }
    );

    expect(result.ok).toBe(true);
    expect(runSkuSlicePostCorrectionsUtil).toHaveBeenCalledWith(
      expect.objectContaining({
        dateFrom: new Date("2026-04-01T00:00:00.000Z"),
        dateTo: new Date("2026-04-03T00:00:00.000Z"),
        apply: true,
        onProgress,
      })
    );
    expect(createEventUtil).toHaveBeenCalledOnce();
  });

  it("fails on invalid params", async () => {
    const result = await runSkuSlicesPostCorrectionsRun({ dateFrom: "bad" }, {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Invalid params");
    }
  });
});
