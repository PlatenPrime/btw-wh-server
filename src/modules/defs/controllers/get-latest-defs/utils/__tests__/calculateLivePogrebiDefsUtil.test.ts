import { beforeEach, describe, expect, it, vi } from "vitest";
import { calculateLivePogrebiDefsUtil } from "../calculateLivePogrebiDefsUtil.js";

vi.mock("../../../../../poses/utils/getPogrebiDefStocks.js", () => ({
  getPogrebiDefStocks: vi.fn(),
}));
vi.mock("../../../../utils/getArtLimits.js", () => ({
  getArtLimits: vi.fn(),
}));
vi.mock("../../../../../poses/utils/getSharikStocks.js", () => ({
  getSharikStocks: vi.fn(),
}));

import { getPogrebiDefStocks } from "../../../../../poses/utils/getPogrebiDefStocks.js";
import { getArtLimits } from "../../../../utils/getArtLimits.js";
import { getSharikStocks } from "../../../../../poses/utils/getSharikStocks.js";

describe("calculateLivePogrebiDefsUtil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("считает дефициты из poses + sharik и возвращает totals", async () => {
    vi.mocked(getPogrebiDefStocks).mockResolvedValue({
      ART001: { nameukr: "Товар 1", quant: 10, boxes: 1 },
      ART002: { nameukr: "Товар 2", quant: 5, boxes: 1 },
    });
    vi.mocked(getArtLimits).mockResolvedValue({ ART001: 20, ART002: 0 });
    vi.mocked(getSharikStocks).mockResolvedValue({
      ART001: {
        nameukr: "Товар 1",
        quant: 10,
        boxes: 1,
        sharikQuant: 5,
        difQuant: -5,
        limit: 20,
      },
      ART002: {
        nameukr: "Товар 2",
        quant: 5,
        boxes: 1,
        sharikQuant: 100,
        difQuant: 95,
        limit: 0,
      },
    });

    const result = await calculateLivePogrebiDefsUtil();

    expect(result.total).toBe(1);
    expect(result.totalCriticalDefs).toBe(1);
    expect(result.totalLimitDefs).toBe(0);
    expect(result.result.ART001.nameukr).toBe("Товар 1");
    expect(result.result.ART002).toBeUndefined();
    expect(result.calculatedAt).toBeInstanceOf(Date);
  });
});
