import { beforeEach, describe, expect, it, vi } from "vitest";
import { getYumiStockData } from "../getYumiStockData.js";
import { browserGet } from "../../../utils/browserRequest.js";

vi.mock("../../../utils/browserRequest.js");

describe("getYumiStockData", () => {
  beforeEach(() => {
    vi.mocked(browserGet).mockReset();
  });

  describe("Валидация входных данных", () => {
    it("должен выбрасывать ошибку при пустой ссылке", async () => {
      await expect(getYumiStockData("")).rejects.toThrow(
        "Link is required and must be a string"
      );
    });

    it("должен выбрасывать ошибку при null", async () => {
      await expect(
        getYumiStockData(null as unknown as string)
      ).rejects.toThrow("Link is required and must be a string");
    });

    it("должен выбрасывать ошибку при undefined", async () => {
      await expect(
        getYumiStockData(undefined as unknown as string)
      ).rejects.toThrow("Link is required and must be a string");
    });

    it("должен выбрасывать ошибку при не-строковом link", async () => {
      await expect(
        getYumiStockData(123 as unknown as string)
      ).rejects.toThrow("Link is required and must be a string");
    });
  });

  describe("Успешные сценарии", () => {
    it("должен использовать минимальную оптовую цену, делить по количеству в упаковке и масштабировать stock", async () => {
      const mockHtml = `
        <div data-qaid="product_name">Неон Assorted (100шт)</div>
        <span data-qaid="product_status_sticky_panel" title="В наявності 999 од.">В наявності 999 од.</span>
        <div data-qaid="wholesale_price">220,00 грн</div>
        <div data-qaid="wholesale_price">214.90 грн</div>
      `;
      vi.mocked(browserGet).mockResolvedValue(mockHtml);

      const result = await getYumiStockData("https://example.com/product/1");

      expect(result).toEqual({
        stock: 99900,
        price: 2.15,
        title: "Неон Assorted (100шт)",
      });
    });

    it("должен использовать обычную цену, когда нет оптовых цен", async () => {
      const mockHtml = `
        <div data-qaid="product_name">Standard White</div>
        <span data-qaid="product_status_sticky_panel" title="В наявності 42803 од.">В наявності 42803 од.</span>
        <div data-qaid="product_price" data-qaprice="1.58">1.58 грн</div>
      `;
      vi.mocked(browserGet).mockResolvedValue(mockHtml);

      const result = await getYumiStockData("https://example.com/product/2");

      expect(result).toEqual({
        stock: 42803,
        price: 1.58,
        title: "Standard White",
      });
    });

    it("должен корректно парсить цену с пробелами и запятыми", async () => {
      const mockHtml = `
        <div data-qaid="product_name">Товар</div>
        <span data-qaid="product_status_sticky_panel" title="В наявності 100 од.">В наявності 100 од.</span>
        <div data-qaid="product_price">1 234,56 грн</div>
      `;
      vi.mocked(browserGet).mockResolvedValue(mockHtml);

      const result = await getYumiStockData("https://example.com/product/3");

      expect(result?.price).toBe(1234.56);
      expect(result?.stock).toBe(100);
    });

    it("должен возвращать stock = 0, когда товара нет в наличии", async () => {
      const mockHtml = `
        <div data-qaid="product_name">Товар</div>
        <span data-qaid="product_status_sticky_panel" title="Немає в наявності">Немає в наявності</span>
        <div data-qaid="product_price">10,00 грн</div>
      `;
      vi.mocked(browserGet).mockResolvedValue(mockHtml);

      const result = await getYumiStockData("https://example.com/product/4");

      expect(result).toEqual({
        stock: 0,
        price: 10.0,
        title: "Товар",
      });
    });
  });

  describe("Отсутствие или невалидные данные", () => {
    const negativeOutcome = { stock: -1, price: -1 };

    it("должен возвращать { stock: -1, price: -1 }, когда нет цены", async () => {
      const mockHtml = `
        <div data-qaid="product_name">Товар без цены</div>
        <span data-qaid="product_status_sticky_panel" title="В наявності 10 од.">В наявності 10 од.</span>
      `;
      vi.mocked(browserGet).mockResolvedValue(mockHtml);

      const result = await getYumiStockData("https://example.com/product/5");

      expect(result).toEqual(negativeOutcome);
    });

    it("должен возвращать { stock: -1, price: -1 }, когда цена нечисловая", async () => {
      const mockHtml = `
        <div data-qaid="product_name">Товар без цены</div>
        <span data-qaid="product_status_sticky_panel" title="В наявності 10 од.">В наявності 10 од.</span>
        <div data-qaid="product_price">немає ціни</div>
      `;
      vi.mocked(browserGet).mockResolvedValue(mockHtml);

      const result = await getYumiStockData("https://example.com/product/6");

      expect(result).toEqual(negativeOutcome);
    });
  });

  describe("Обработка ошибок", () => {
    it("должен возвращать { stock: -1, price: -1 } при ошибке сети", async () => {
      vi.mocked(browserGet).mockRejectedValue(new Error("Network error"));

      const result = await getYumiStockData("https://example.com/product/7");

      expect(result).toEqual({ stock: -1, price: -1 });
    });
  });
});

