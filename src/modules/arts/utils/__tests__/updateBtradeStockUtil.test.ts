import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestArt } from "../../../../test/setup.js";
import { getSharikStockData } from "../../../browser/sharik/utils/getSharikStockData.js";
import { Art } from "../../models/Art.js";
import { updateBtradeStockUtil } from "../updateBtradeStockUtil.js";

vi.mock("../../../browser/sharik/utils/getSharikStockData.js", () => ({
  getSharikStockData: vi.fn(),
}));

const mockGetSharikStockData = vi.mocked(getSharikStockData);

describe("updateBtradeStockUtil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("обновляет btradeStock когда товар найден на sharik.ua", async () => {
    await createTestArt({ artikul: "5555-1111", zone: "A1" });
    mockGetSharikStockData.mockResolvedValue({
      nameukr: "Товар",
      price: 100,
      quantity: 42,
    });

    const result = await updateBtradeStockUtil({ artikul: "5555-1111" });

    expect(result).toBeTruthy();
    expect(result?.artikul).toBe("5555-1111");
    expect(result?.btradeStock?.value).toBe(42);
    expect(result?.btradeStock?.date).toBeInstanceOf(Date);

    const saved = await Art.findOne({ artikul: "5555-1111" }).lean();
    expect(saved?.btradeStock?.value).toBe(42);
  });

  it("возвращает null если товар не найден на sharik.ua", async () => {
    await createTestArt({ artikul: "5555-2222", zone: "A1" });
    mockGetSharikStockData.mockResolvedValue(null);

    const result = await updateBtradeStockUtil({ artikul: "5555-2222" });

    expect(result).toBeNull();
  });

  it("пробрасывает ошибку при сбое внешнего API", async () => {
    await createTestArt({ artikul: "5555-3333", zone: "A1" });
    mockGetSharikStockData.mockRejectedValue(new Error("Network error"));

    await expect(
      updateBtradeStockUtil({ artikul: "5555-3333" })
    ).rejects.toThrow("Network error");
  });
});
