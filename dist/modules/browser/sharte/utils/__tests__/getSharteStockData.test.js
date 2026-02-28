import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSharteStockData } from "../getSharteStockData.js";
import { browserGet } from "../../../utils/browserRequest.js";
vi.mock("../../../utils/browserRequest.js");
const productPageWithCatalogElement = (productId, priceHtml = "") => `<!DOCTYPE html>
<html><body>
  <div id="catalogElement" class="item" data-product-id="${productId}" data-iblock-id="" data-prop-id="" data-hide-measure="N"></div>
  ${priceHtml}
</body></html>`;
describe("getSharteStockData", () => {
    beforeEach(() => {
        vi.mocked(browserGet).mockReset();
    });
    it("returns StockInfo when page has data-product-id and addCart returns CATALOG_QUANTITY", async () => {
        const productUrl = "https://sharte.net/catalog/product/4777/";
        vi.mocked(browserGet)
            .mockResolvedValueOnce(productPageWithCatalogElement("4777"))
            .mockResolvedValueOnce({
            ID: "4777",
            "~NAME": "Product Name",
            CATALOG_QUANTITY: 10,
            CATALOG_QUANTITY_RESERVED: 2,
            "~PRICE": 123.45,
        });
        const result = await getSharteStockData(productUrl);
        expect(result).toEqual({
            id: "4777",
            name: "Product Name",
            stock: 10,
            reserved: 2,
            available: 8,
            price: 123.45,
        });
        expect(browserGet).toHaveBeenNthCalledWith(1, productUrl);
        expect(browserGet).toHaveBeenNthCalledWith(2, "https://sharte.net/ajax.php?act=addCart&id=4777&q=1&site_id=s1");
    });
    it("returns negative outcome when HTML has no #catalogElement with data-product-id", async () => {
        vi.mocked(browserGet).mockResolvedValueOnce("<html><body><div>No catalog element</div></body></html>");
        const result = await getSharteStockData("https://sharte.net/catalog/product/999/");
        expect(result).toEqual({
            id: "",
            name: "",
            stock: -1,
            reserved: 0,
            available: -1,
            price: -1,
        });
        expect(browserGet).toHaveBeenCalledTimes(1);
    });
    it("returns negative outcome when #catalogElement exists but data-product-id is empty", async () => {
        vi.mocked(browserGet).mockResolvedValueOnce(`<!DOCTYPE html><html><body><div id="catalogElement" class="item" data-product-id=""></div></body></html>`);
        const result = await getSharteStockData("https://sharte.net/catalog/product/999/");
        expect(result.stock).toBe(-1);
        expect(result.price).toBe(-1);
        expect(browserGet).toHaveBeenCalledTimes(1);
    });
    it("returns StockInfo with price from a.price.changePrice when addCart has no quantity", async () => {
        const productUrl = "https://sharte.net/catalog/product/999/";
        const html = productPageWithCatalogElement("999", '<a class="price changePrice">1.85 грн.</a>');
        vi.mocked(browserGet)
            .mockResolvedValueOnce(html)
            .mockResolvedValueOnce({});
        const result = await getSharteStockData(productUrl);
        expect(result).toEqual({
            id: "999",
            name: "",
            stock: 0,
            reserved: 0,
            available: 0,
            price: 1.85,
        });
        expect(browserGet).toHaveBeenNthCalledWith(1, productUrl);
        expect(browserGet).toHaveBeenNthCalledWith(2, "https://sharte.net/ajax.php?act=addCart&id=999&q=1&site_id=s1");
    });
    it("returns negative outcome when addCart empty and page has no price element", async () => {
        const productUrl = "https://sharte.net/product/999";
        vi.mocked(browserGet)
            .mockResolvedValueOnce(productPageWithCatalogElement("999"))
            .mockResolvedValueOnce({});
        const result = await getSharteStockData(productUrl);
        expect(result).toEqual({
            id: "999",
            name: "",
            stock: -1,
            reserved: 0,
            available: -1,
            price: -1,
        });
        expect(browserGet).toHaveBeenCalledTimes(2);
    });
    it("returns negative outcome when page request fails", async () => {
        vi.mocked(browserGet).mockRejectedValueOnce(new Error("Network error"));
        const result = await getSharteStockData("https://sharte.net/catalog/product/999/");
        expect(result).toEqual({
            id: "",
            name: "",
            stock: -1,
            reserved: 0,
            available: -1,
            price: -1,
        });
    });
    it("returns StockInfo without price when PRICE is absent in addCart response", async () => {
        const productUrl = "https://sharte.net/catalog/product/4778/";
        vi.mocked(browserGet)
            .mockResolvedValueOnce(productPageWithCatalogElement("4778"))
            .mockResolvedValueOnce({
            ID: "4778",
            "~NAME": "Product Without Price",
            CATALOG_QUANTITY: 5,
            CATALOG_QUANTITY_RESERVED: 0,
        });
        const result = await getSharteStockData(productUrl);
        expect(result).toEqual({
            id: "4778",
            name: "Product Without Price",
            stock: 5,
            reserved: 0,
            available: 5,
        });
        expect(result).not.toHaveProperty("price");
    });
    it("returns negative outcome when browserGet for addCart fails", async () => {
        const productUrl = "https://sharte.net/catalog/product/4777/";
        vi.mocked(browserGet)
            .mockResolvedValueOnce(productPageWithCatalogElement("4777"))
            .mockRejectedValueOnce(new Error("Network error"));
        const result = await getSharteStockData(productUrl);
        expect(result).toEqual({
            id: "4777",
            name: "",
            stock: -1,
            reserved: 0,
            available: -1,
            price: -1,
        });
    });
    it("returns negative outcome when productUrl is empty string", async () => {
        const result = await getSharteStockData("");
        expect(result.stock).toBe(-1);
        expect(result.price).toBe(-1);
        expect(browserGet).not.toHaveBeenCalled();
    });
});
