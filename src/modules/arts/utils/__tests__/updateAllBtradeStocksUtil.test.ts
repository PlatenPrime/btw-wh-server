import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestArt } from "../../../../test/setup.js";
import { getCachedSharikProductRestsMap } from "../../../browser/sharik/utils/product-rests/index.js";
import { Art } from "../../models/Art.js";
import { updateAllBtradeStocksUtil } from "../updateAllBtradeStocksUtil.js";

vi.mock("../../../browser/sharik/utils/product-rests/index.js", () => ({
  getCachedSharikProductRestsMap: vi.fn(),
}));

const mockGetCachedMap = vi.mocked(getCachedSharikProductRestsMap);

describe("updateAllBtradeStocksUtil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("обновляет btradeStock из actualQuantity одним fetch map", async () => {
    await createTestArt({ artikul: "ART-001", zone: "A1" });
    mockGetCachedMap.mockResolvedValue(
      new Map([
        ["ART-001", { actualQuantity: 10, sliceQuantity: 12, price: 1 }],
      ])
    );

    const result = await updateAllBtradeStocksUtil();

    expect(result).toEqual({
      total: 1,
      updated: 1,
      errors: 0,
      notFound: 0,
    });
    expect(mockGetCachedMap).toHaveBeenCalledTimes(1);

    const updated = await Art.findOne({ artikul: "ART-001" }).lean();
    expect(updated?.btradeStock?.value).toBe(10);
  });

  it("увеличивает notFound когда товар не найден в map", async () => {
    await createTestArt({ artikul: "ART-MISSING", zone: "A1" });
    mockGetCachedMap.mockResolvedValue(new Map());

    const result = await updateAllBtradeStocksUtil();

    expect(result).toEqual({
      total: 1,
      updated: 0,
      errors: 0,
      notFound: 1,
    });
  });

  it("увеличивает errors при сбое внешнего API на уровне map", async () => {
    await createTestArt({ artikul: "ART-ERR", zone: "A1" });
    mockGetCachedMap.mockRejectedValue(new Error("Network error"));

    await expect(updateAllBtradeStocksUtil()).rejects.toThrow("Network error");
  });

  it("возвращает нулевую статистику для пустой базы", async () => {
    const result = await updateAllBtradeStocksUtil();

    expect(result).toEqual({
      total: 0,
      updated: 0,
      errors: 0,
      notFound: 0,
    });
    expect(mockGetCachedMap).not.toHaveBeenCalled();
  });
});
