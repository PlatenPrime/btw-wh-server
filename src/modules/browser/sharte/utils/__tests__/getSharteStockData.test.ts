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
      "~PRICE": 123.45,
    });
    const result = await getSharteStockData("4777", "");
    expect(result).toEqual({
      id: "4777",
      name: "Product Name",
      stock: 10,
      reserved: 2,
      available: 8,
      price: 123.45,
    });
    expect(browserGet).toHaveBeenCalledWith(
      "https://sharte.net/ajax.php?act=addCart&id=4777&q=1&site_id=s1"
    );
  });

  it("returns null when CATALOG_QUANTITY is undefined and productUrl empty", async () => {
    vi.mocked(browserGet).mockResolvedValue({});
    const result = await getSharteStockData("999", "");
    expect(result).toBeNull();
    expect(browserGet).toHaveBeenCalledTimes(1);
  });

  it("returns StockInfo with price from a.price.changePrice when CATALOG_QUANTITY undefined and productUrl given", async () => {
    const productPageHtml = `
      <!DOCTYPE html>
      <html><body>
        <a class="price changePrice">1.85 грн.</a>
      </body></html>
    `;
    vi.mocked(browserGet)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce(productPageHtml);
    const result = await getSharteStockData(
      "999",
      "https://sharte.net/catalog/product/999/"
    );
    expect(result).toEqual({
      id: "999",
      name: "",
      stock: 0,
      reserved: 0,
      available: 0,
      price: 1.85,
    });
    expect(browserGet).toHaveBeenNthCalledWith(
      1,
      "https://sharte.net/ajax.php?act=addCart&id=999&q=1&site_id=s1"
    );
    expect(browserGet).toHaveBeenNthCalledWith(
      2,
      "https://sharte.net/catalog/product/999/"
    );
  });

  it("returns null when addCart empty and productUrl page has no price element", async () => {
    vi.mocked(browserGet)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce("<html><body><div>No price here</div></body></html>");
    const result = await getSharteStockData("999", "https://sharte.net/product/999");
    expect(result).toBeNull();
    expect(browserGet).toHaveBeenCalledTimes(2);
  });

  it("returns null when addCart empty and productUrl request fails", async () => {
    vi.mocked(browserGet)
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("Network error"));
    const result = await getSharteStockData("999", "https://sharte.net/product/999");
    expect(result).toBeNull();
  });

  it("returns StockInfo without price when PRICE is absent", async () => {
    vi.mocked(browserGet).mockResolvedValue({
      ID: "4778",
      "~NAME": "Product Without Price",
      CATALOG_QUANTITY: 5,
      CATALOG_QUANTITY_RESERVED: 0,
    });
    const result = await getSharteStockData("4778", "");
    expect(result).toEqual({
      id: "4778",
      name: "Product Without Price",
      stock: 5,
      reserved: 0,
      available: 5,
    });
    expect(result).not.toHaveProperty("price");
  });

  it("throws when browserGet for addCart fails", async () => {
    vi.mocked(browserGet).mockRejectedValue(new Error("Network error"));
    await expect(getSharteStockData("4777", "")).rejects.toThrow("Network error");
  });
});
