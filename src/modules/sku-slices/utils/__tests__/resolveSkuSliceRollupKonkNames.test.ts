import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../skus/models/Sku.js", () => ({
  Sku: { distinct: vi.fn() },
}));
vi.mock("../../../slices/config/excludedCompetitors.js", () => ({
  getExcludedCompetitorSet: vi.fn(),
  normalizeCompetitorName: vi.fn((value: string) => value.trim().toLowerCase()),
}));

import { Sku } from "../../../skus/models/Sku.js";
import { getExcludedCompetitorSet } from "../../../slices/config/excludedCompetitors.js";
import { resolveSkuSliceRollupKonkNames } from "../resolveSkuSliceRollupKonkNames.js";

describe("resolveSkuSliceRollupKonkNames", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getExcludedCompetitorSet).mockReturnValue(new Set(["yumi"]));
  });

  it("dedupes and excludes skuSlices competitors", async () => {
    vi.mocked(Sku.distinct).mockResolvedValue([
      "air",
      " Air ",
      "balun",
      "yumi",
      "",
    ] as never);

    await expect(resolveSkuSliceRollupKonkNames()).resolves.toEqual([
      "air",
      "balun",
    ]);
  });
});
