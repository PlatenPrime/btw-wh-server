import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAirStockData } from "../getAirStockData.js";
import { browserGet } from "../../../utils/browserRequest.js";

vi.mock("../../../utils/browserRequest.js");

describe("getAirStockData", () => {
  beforeEach(() => {
    vi.mocked(browserGet).mockReset();
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
    it("должен возвращать { stock, price } при успешном парсинге", async () => {
      const mockHtml = `
        <input type="hidden" id="max-product-quantity" value="6600" name="max_quantity">
        <div class="us-price-block us-price-block-not-special d-flex align-items-center">
          <span class="title">Ціна за ед.:</span>
          <div class="us-price-actual">2.08 грн.</div>
        </div>
      `;
      vi.mocked(browserGet).mockResolvedValue(mockHtml);

      const result = await getAirStockData(
        "https://example.com/product/123"
      );

      expect(result).toEqual({ stock: 6600, price: 2.08 });
      expect(browserGet).toHaveBeenCalledWith(
        "https://example.com/product/123"
      );
    });

    it("должен правильно обрабатывать цену с запятой и пробелами", async () => {
      const mockHtml = `
        <input type="hidden" id="max-product-quantity" value="100" name="max_quantity">
        <div class="us-price-actual">1 234,56 грн.</div>
      `;
      vi.mocked(browserGet).mockResolvedValue(mockHtml);

      const result = await getAirStockData("https://example.com/product/1");

      expect(result).toEqual({ stock: 100, price: 1234.56 });
    });
  });

  describe("Отсутствие или невалидные данные", () => {
    it("должен возвращать null когда нет #max-product-quantity", async () => {
      const mockHtml = `
        <div class="us-price-actual">2.08 грн.</div>
      `;
      vi.mocked(browserGet).mockResolvedValue(mockHtml);

      const result = await getAirStockData("https://example.com/product/1");

      expect(result).toBeNull();
    });

    it("должен возвращать null когда value у max-product-quantity пустой", async () => {
      const mockHtml = `
        <input type="hidden" id="max-product-quantity" value="" name="max_quantity">
        <div class="us-price-actual">2.08 грн.</div>
      `;
      vi.mocked(browserGet).mockResolvedValue(mockHtml);

      const result = await getAirStockData("https://example.com/product/1");

      expect(result).toBeNull();
    });

    it("должен возвращать null когда нет .us-price-actual", async () => {
      const mockHtml = `
        <input type="hidden" id="max-product-quantity" value="6600" name="max_quantity">
      `;
      vi.mocked(browserGet).mockResolvedValue(mockHtml);

      const result = await getAirStockData("https://example.com/product/1");

      expect(result).toBeNull();
    });

    it("должен возвращать null когда текст цены нечисловой", async () => {
      const mockHtml = `
        <input type="hidden" id="max-product-quantity" value="6600" name="max_quantity">
        <div class="us-price-actual">немає ціни</div>
      `;
      vi.mocked(browserGet).mockResolvedValue(mockHtml);

      const result = await getAirStockData("https://example.com/product/1");

      expect(result).toBeNull();
    });
  });

  describe("Обработка ошибок", () => {
    it("должен выбрасывать ошибку при ошибке сети", async () => {
      vi.mocked(browserGet).mockRejectedValue(new Error("Network error"));

      await expect(
        getAirStockData("https://example.com/product/1")
      ).rejects.toThrow("Failed to fetch data from air: Network error");
    });
  });
});
