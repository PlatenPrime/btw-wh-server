import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestArt } from "../../../../test/setup.js";
import { getSharikStockData } from "../../../browser/sharik/utils/getSharikStockData.js";
import { Art } from "../../models/Art.js";
import { updateAllBtradeStocksUtil } from "../updateAllBtradeStocksUtil.js";

vi.mock("../../../browser/sharik/utils/getSharikStockData.js", () => ({
  getSharikStockData: vi.fn(),
}));

const mockGetSharikStockData = vi.mocked(getSharikStockData);

describe("updateAllBtradeStocksUtil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("обновляет btradeStock и возвращает статистику updated", async () => {
    await createTestArt({ artikul: "ART-001", zone: "A1" });
    mockGetSharikStockData.mockResolvedValue({
      nameukr: "A",
      price: 1,
      quantity: 10,
    });

    const result = await updateAllBtradeStocksUtil();

    expect(result).toEqual({
      total: 1,
      updated: 1,
      errors: 0,
      notFound: 0,
    });

    const updated = await Art.findOne({ artikul: "ART-001" }).lean();
    expect(updated?.btradeStock?.value).toBe(10);
  });

  it("увеличивает notFound когда товар не найден на sharik.ua", async () => {
    await createTestArt({ artikul: "ART-MISSING", zone: "A1" });
    mockGetSharikStockData.mockResolvedValue(null);

    const result = await updateAllBtradeStocksUtil();

    expect(result).toEqual({
      total: 1,
      updated: 0,
      errors: 0,
      notFound: 1,
    });
  });

  it("увеличивает errors при сбое внешнего API", async () => {
    await createTestArt({ artikul: "ART-ERR", zone: "A1" });
    mockGetSharikStockData.mockRejectedValue(new Error("Network error"));

    const result = await updateAllBtradeStocksUtil();

    expect(result).toEqual({
      total: 1,
      updated: 0,
      errors: 1,
      notFound: 0,
    });
  });

  it("возвращает нулевую статистику для пустой базы", async () => {
    const result = await updateAllBtradeStocksUtil();

    expect(result).toEqual({
      total: 0,
      updated: 0,
      errors: 0,
      notFound: 0,
    });
    expect(mockGetSharikStockData).not.toHaveBeenCalled();
  });
});
