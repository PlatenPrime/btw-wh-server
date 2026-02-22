import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSharikStockData } from "../getSharikStockData.js";
import { browserGet } from "../../../utils/browserRequest.js";
vi.mock("../../../utils/browserRequest.js");
describe("getSharikStockData", () => {
    beforeEach(() => {
        vi.mocked(browserGet).mockReset();
    });
    describe("Валидация входных данных", () => {
        it("должен выбрасывать ошибку при пустом артикуле", async () => {
            await expect(getSharikStockData("")).rejects.toThrow("Artikul is required and must be a string");
        });
        it("должен выбрасывать ошибку при null артикуле", async () => {
            await expect(getSharikStockData(null)).rejects.toThrow("Artikul is required and must be a string");
        });
        it("должен выбрасывать ошибку при undefined артикуле", async () => {
            await expect(getSharikStockData(undefined)).rejects.toThrow("Artikul is required and must be a string");
        });
        it("должен выбрасывать ошибку при не-строковом артикуле", async () => {
            await expect(getSharikStockData(123)).rejects.toThrow("Artikul is required and must be a string");
        });
    });
    describe("Успешные сценарии", () => {
        it("должен возвращать данные товара при успешном парсинге", async () => {
            const mockHtml = `
        <div class="car-col">
          <div class="one-item">
            <div class="one-item-tit">Тестовый товар</div>
            <div class="one-item-price">1 250,50 грн</div>
            <div class="one-item-quantity">В наличии: 15 шт</div>
          </div>
        </div>
      `;
            vi.mocked(browserGet).mockResolvedValue(mockHtml);
            const result = await getSharikStockData("test-artikul");
            expect(result).toEqual({
                nameukr: "Тестовый товар",
                price: 125050,
                quantity: 15,
            });
            expect(browserGet).toHaveBeenCalledWith("https://sharik.ua/ua/search/?q=test-artikul");
        });
        it("должен правильно обрабатывать цену с запятыми и пробелами", async () => {
            const mockHtml = `
        <div class="car-col">
          <div class="one-item">
            <div class="one-item-tit">Товар</div>
            <div class="one-item-price">2,500.75 грн</div>
            <div class="one-item-quantity">10 шт</div>
          </div>
        </div>
      `;
            vi.mocked(browserGet).mockResolvedValue(mockHtml);
            const result = await getSharikStockData("test");
            expect(result?.price).toBe(2500.75);
        });
        it("должен возвращать null когда нет товаров", async () => {
            vi.mocked(browserGet).mockResolvedValue(`<div class="car-col"></div>`);
            const result = await getSharikStockData("nonexistent");
            expect(result).toBeNull();
        });
    });
    describe("Обработка ошибок", () => {
        it("должен выбрасывать ошибку при ошибке сети", async () => {
            vi.mocked(browserGet).mockRejectedValue(new Error("Network error"));
            await expect(getSharikStockData("test")).rejects.toThrow("Failed to fetch data from sharik.ua: Network error");
        });
        it("должен правильно кодировать артикул в URL", async () => {
            vi.mocked(browserGet).mockResolvedValue(`<div class="car-col"></div>`);
            await getSharikStockData("тест с пробелами & символами");
            expect(browserGet).toHaveBeenCalledWith("https://sharik.ua/ua/search/?q=%D1%82%D0%B5%D1%81%D1%82%20%D1%81%20%D0%BF%D1%80%D0%BE%D0%B1%D0%B5%D0%BB%D0%B0%D0%BC%D0%B8%20%26%20%D1%81%D0%B8%D0%BC%D0%B2%D0%BE%D0%BB%D0%B0%D0%BC%D0%B8");
        });
    });
});
