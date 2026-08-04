import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCachedSharikProductRestsMap } from "../../../browser/sharik/utils/product-rests/index.js";
import { getSharikStocks } from "../getSharikStocks.js";
import { IMergedPosesResult } from "../mergePoses.js";

vi.mock("../../../browser/sharik/utils/product-rests/index.js", () => ({
  getCachedSharikProductRestsMap: vi.fn(),
}));

const mockedGetCachedMap = vi.mocked(getCachedSharikProductRestsMap);

describe("getSharikStocks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("расширяет stocks actualQuantity из product_rests", async () => {
    const mockStocks: IMergedPosesResult = {
      ART001: { nameukr: "Товар 1", quant: 10, boxes: 2 },
      ART002: { nameukr: "Товар 2", quant: 5, boxes: 1 },
    };

    mockedGetCachedMap.mockResolvedValue(
      new Map([
        ["ART001", { actualQuantity: 15, sliceQuantity: 20, price: 100 }],
        ["ART002", { actualQuantity: 8, sliceQuantity: 9, price: 200 }],
      ])
    );

    const result = await getSharikStocks(mockStocks, {
      ART001: 20,
      ART002: 10,
    });

    expect(mockedGetCachedMap).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      ART001: {
        nameukr: "Товар 1",
        quant: 10,
        boxes: 2,
        sharikQuant: 15,
        difQuant: 5,
        limit: 20,
      },
      ART002: {
        nameukr: "Товар 2",
        quant: 5,
        boxes: 1,
        sharikQuant: 8,
        difQuant: 3,
        limit: 10,
      },
    });
  });

  it("ставит sharikQuant=0 если артикула нет в map", async () => {
    const mockStocks: IMergedPosesResult = {
      ART001: { nameukr: "Товар 1", quant: 10, boxes: 1 },
    };
    mockedGetCachedMap.mockResolvedValue(new Map());

    const result = await getSharikStocks(mockStocks);

    expect(result.ART001).toEqual({
      nameukr: "Товар 1",
      quant: 10,
      boxes: 1,
      sharikQuant: 0,
      difQuant: -10,
      limit: undefined,
    });
  });

  it("бросает при ошибке fetch map", async () => {
    mockedGetCachedMap.mockRejectedValue(new Error("Network error"));

    await expect(
      getSharikStocks({ ART001: { nameukr: "T", quant: 1, boxes: 1 } })
    ).rejects.toThrow("Не удалось получить данные Sharik");
  });
});
