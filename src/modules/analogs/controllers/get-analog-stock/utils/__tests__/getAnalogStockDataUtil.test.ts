import { beforeEach, describe, expect, it, vi } from "vitest";
import { Analog } from "../../../../models/Analog.js";

vi.mock("../../../../../browser/air/utils/getAirStockData.js", () => ({
  getAirStockData: vi.fn(),
}));
vi.mock("../../../../../browser/balun/utils/getBalunStockData.js", () => ({
  getBalunStockData: vi.fn(),
}));
vi.mock("../../../../../browser/yumi/utils/getYumiStockData.js", () => ({
  getYumiStockData: vi.fn(),
}));
vi.mock("../../../../../browser/yumin/utils/getYuminStockData.js", () => ({
  getYuminStockData: vi.fn(),
}));
vi.mock("../../../../../browser/sharte/utils/getSharteStockData.js", () => ({
  getSharteStockData: vi.fn(),
}));

import { getAirStockData } from "../../../../../browser/air/utils/getAirStockData.js";
import {
  getAnalogStockDataUtil,
  UNSUPPORTED_KONK_CODE,
} from "../getAnalogStockDataUtil.js";

const mockGetAirStockData = vi.mocked(getAirStockData);

describe("getAnalogStockDataUtil", () => {
  beforeEach(async () => {
    await Analog.deleteMany({});
    mockGetAirStockData.mockReset();
  });

  it("returns null when analog not found", async () => {
    const result = await getAnalogStockDataUtil("000000000000000000000000");
    expect(result).toBeNull();
  });

  it("throws UNSUPPORTED_KONK for unknown konkName", async () => {
    const analog = await Analog.create({
      konkName: "unknown-shop",
      prodName: "p",
      url: "https://ex.com/p",
      artikul: "A1",
    });

    await expect(
      getAnalogStockDataUtil(analog._id.toString()),
    ).rejects.toMatchObject({ code: UNSUPPORTED_KONK_CODE });
  });

  it("calls konk-specific getter and maps stock and price", async () => {
    mockGetAirStockData.mockResolvedValue({ stock: 5, price: 99 });

    const analog = await Analog.create({
      konkName: "Air",
      prodName: "p",
      url: "https://air.com/item",
      artikul: "A2",
    });

    const result = await getAnalogStockDataUtil(analog._id.toString());

    expect(mockGetAirStockData).toHaveBeenCalledWith("https://air.com/item");
    expect(result).toEqual({ stock: 5, price: 99 });
  });

  it("uses -1 when getter omits price", async () => {
    mockGetAirStockData.mockResolvedValue({ stock: 3 } as import("../../../../../browser/air/utils/air-product-types/airProductInfo.js").AirProductInfo);

    const analog = await Analog.create({
      konkName: "air",
      prodName: "p",
      url: "https://air.com/no-price",
      artikul: "A3",
    });

    const result = await getAnalogStockDataUtil(analog._id.toString());
    expect(result).toEqual({ stock: 3, price: -1 });
  });
});
