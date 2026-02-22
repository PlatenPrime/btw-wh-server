import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSharteStockData } from "../getSharteStockData.js";
import { browserGet } from "../../../utils/browserRequest.js";

vi.mock("../../../utils/browserRequest.js");

describe("getSharteStockData", () => {
  beforeEach(() => {
    vi.mocked(browserGet).mockReset();
  });

  it("returns StockInfo when CATALOG_QUANTITY is present", async () => {
    vi.mocked(browserGet).mockResolvedValue({
      ID: "4777",
      "~NAME": "Product Name",
      CATALOG_QUANTITY: 10,
      CATALOG_QUANTITY_RESERVED: 2,
    });
    const result = await getSharteStockData("4777");
    expect(result).toEqual({
      id: "4777",
      name: "Product Name",
      stock: 10,
      reserved: 2,
      available: 8,
    });
    expect(browserGet).toHaveBeenCalledWith(
      "https://sharte.net/ajax.php?act=addCart&id=4777&q=1&site_id=s1"
    );
  });

  it("returns null when CATALOG_QUANTITY is undefined", async () => {
    vi.mocked(browserGet).mockResolvedValue({});
    const result = await getSharteStockData("999");
    expect(result).toBeNull();
  });

  it("throws when browserGet fails", async () => {
    vi.mocked(browserGet).mockRejectedValue(new Error("Network error"));
    await expect(getSharteStockData("4777")).rejects.toThrow("Network error");
  });
});
