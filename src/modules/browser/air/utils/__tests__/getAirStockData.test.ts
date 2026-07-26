import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAirStockData } from "../getAirStockData.js";
import { fetchPageHtml } from "../../../utils/fetchPageHtml.js";
import { logBrowserError } from "../../../utils/browserRequest.js";

const mockWarn = vi.hoisted(() => vi.fn());

vi.mock("../../../utils/fetchPageHtml.js");
vi.mock("../../../utils/browserRequest.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../utils/browserRequest.js")>();
  return { ...actual, logBrowserError: vi.fn() };
});
vi.mock("../../../../../logging/createLogger.js", () => ({
  createLogger: () => ({
    warn: mockWarn,
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe("getAirStockData", () => {
  const originalProxy = process.env.AIR_HTTP_PROXY_URL;

  beforeEach(() => {
    vi.mocked(fetchPageHtml).mockReset();
    vi.mocked(logBrowserError).mockClear();
    mockWarn.mockClear();
    delete process.env.AIR_HTTP_PROXY_URL;
  });

  afterEach(() => {
    if (originalProxy === undefined) {
      delete process.env.AIR_HTTP_PROXY_URL;
    } else {
      process.env.AIR_HTTP_PROXY_URL = originalProxy;
    }
  });

  describe("Валидация входных данных", () => {
    it("должен выбрасывать ошибку при пустой ссылке", async () => {
      await expect(getAirStockData("")).rejects.toThrow(
        "Link is required and must be a string"
      );
    });

    it("должен выбрасывать ошибку при null", async () => {
      await expect(getAirStockData(null as unknown as string)).rejects.toThrow(
        "Link is required and must be a string"
      );
    });

    it("должен выбрасывать ошибку при undefined", async () => {
      await expect(
        getAirStockData(undefined as unknown as string)
      ).rejects.toThrow("Link is required and must be a string");
    });

    it("должен выбрасывать ошибку при не-строковом link", async () => {
      await expect(getAirStockData(123 as unknown as string)).rejects.toThrow(
        "Link is required and must be a string"
      );
    });
  });

  describe("Успешные сценарии", () => {
    it("должен возвращать { stock, price } через Playwright", async () => {
      const mockHtml = `
        <input type="hidden" id="max-product-quantity" value="6600" name="max_quantity">
        <div class="us-price-block us-price-block-not-special d-flex align-items-center">
          <span class="title">Ціна за ед.:</span>
          <div class="us-price-actual">2.08 грн.</div>
        </div>
      `;
      vi.mocked(fetchPageHtml).mockResolvedValue(mockHtml);

      const result = await getAirStockData(
        "https://example.com/product/123"
      );

      expect(result).toEqual({ stock: 6600, price: 2.08 });
      expect(fetchPageHtml).toHaveBeenCalledWith(
        "https://example.com/product/123",
        {
          konkName: "air",
          transport: "playwright",
          proxyUrl: undefined,
          warmUpUrl: "https://example.com/",
        }
      );
    });

    it("передаёт AIR_HTTP_PROXY_URL в fetchPageHtml", async () => {
      process.env.AIR_HTTP_PROXY_URL =
        "http://user:secret@77.47.252.164:50100";
      vi.mocked(fetchPageHtml).mockResolvedValue(`
        <input type="hidden" id="max-product-quantity" value="1" name="max_quantity">
        <div class="us-price-actual">1 грн.</div>
      `);

      await getAirStockData("https://example.com/product/1");

      expect(fetchPageHtml).toHaveBeenCalledWith(
        "https://example.com/product/1",
        {
          konkName: "air",
          transport: "playwright",
          proxyUrl: "http://user:secret@77.47.252.164:50100",
          warmUpUrl: "https://example.com/",
        }
      );
    });

    it("должен правильно обрабатывать цену с запятой и пробелами", async () => {
      const mockHtml = `
        <input type="hidden" id="max-product-quantity" value="100" name="max_quantity">
        <div class="us-price-actual">1 234,56 грн.</div>
      `;
      vi.mocked(fetchPageHtml).mockResolvedValue(mockHtml);

      const result = await getAirStockData("https://example.com/product/1");

      expect(result).toEqual({ stock: 100, price: 1234.56 });
    });
  });

  describe("Отсутствие или невалидные данные", () => {
    const negativeOutcome = { stock: -1, price: -1 };

    it("должен возвращать stock: 0 при валидной цене когда нет #max-product-quantity", async () => {
      const mockHtml = `
        <div class="us-price-actual">2.08 грн.</div>
      `;
      vi.mocked(fetchPageHtml).mockResolvedValue(mockHtml);

      const result = await getAirStockData("https://example.com/product/1");

      expect(result).toEqual({ stock: 0, price: 2.08 });
    });

    it("должен возвращать stock: 0 при валидной цене когда value у max-product-quantity пустой", async () => {
      const mockHtml = `
        <input type="hidden" id="max-product-quantity" value="" name="max_quantity">
        <div class="us-price-actual">2.08 грн.</div>
      `;
      vi.mocked(fetchPageHtml).mockResolvedValue(mockHtml);

      const result = await getAirStockData("https://example.com/product/1");

      expect(result).toEqual({ stock: 0, price: 2.08 });
    });

    it("должен возвращать { stock: -1, price: -1 } когда нет .us-price-actual", async () => {
      const mockHtml = `
        <title>Product</title>
        <input type="hidden" id="max-product-quantity" value="6600" name="max_quantity">
      `;
      vi.mocked(fetchPageHtml).mockResolvedValue(mockHtml);

      const result = await getAirStockData("https://example.com/product/1");

      expect(result).toEqual(negativeOutcome);
      expect(mockWarn).toHaveBeenCalledWith(
        expect.objectContaining({
          context: "Air stock HTML parsed to -1/-1",
          link: "https://example.com/product/1",
          title: "Product",
        }),
        "air stock parse negative"
      );
    });

    it("должен возвращать { stock: -1, price: -1 } когда текст цены нечисловой", async () => {
      const mockHtml = `
        <input type="hidden" id="max-product-quantity" value="6600" name="max_quantity">
        <div class="us-price-actual">немає ціни</div>
      `;
      vi.mocked(fetchPageHtml).mockResolvedValue(mockHtml);

      const result = await getAirStockData("https://example.com/product/1");

      expect(result).toEqual(negativeOutcome);
      expect(mockWarn).toHaveBeenCalled();
    });
  });

  describe("Обработка ошибок", () => {
    it("должен возвращать { stock: -1, price: -1 } при ошибке сети", async () => {
      vi.mocked(fetchPageHtml).mockRejectedValue(new Error("Network error"));

      const result = await getAirStockData("https://example.com/product/1");

      expect(result).toEqual({ stock: -1, price: -1 });
      expect(logBrowserError).toHaveBeenCalled();
      expect(mockWarn).not.toHaveBeenCalled();
    });

    it("должен возвращать { stock: -1, price: -1 } при ошибке Playwright", async () => {
      vi.mocked(fetchPageHtml).mockRejectedValue(
        new Error("Playwright GET HTTP 429: https://example.com/product/1")
      );

      const result = await getAirStockData("https://example.com/product/1");

      expect(result).toEqual({ stock: -1, price: -1 });
      expect(logBrowserError).toHaveBeenCalled();
    });
  });
});
