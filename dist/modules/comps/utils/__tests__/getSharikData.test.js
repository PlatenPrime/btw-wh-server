import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSharikData } from "../getSharikData.js";
// Мокируем только axios
vi.mock("axios");
const mockedAxios = axios;
describe("getSharikData", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe("Валидация входных данных", () => {
        it("должен выбрасывать ошибку при пустом артикуле", async () => {
            await expect(getSharikData("")).rejects.toThrow("Artikul is required and must be a string");
        });
        it("должен выбрасывать ошибку при null артикуле", async () => {
            await expect(getSharikData(null)).rejects.toThrow("Artikul is required and must be a string");
        });
        it("должен выбрасывать ошибку при undefined артикуле", async () => {
            await expect(getSharikData(undefined)).rejects.toThrow("Artikul is required and must be a string");
        });
        it("должен выбрасывать ошибку при не-строковом артикуле", async () => {
            await expect(getSharikData(123)).rejects.toThrow("Artikul is required and must be a string");
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
            mockedAxios.get.mockResolvedValue({ data: mockHtml });
            const result = await getSharikData("test-artikul");
            expect(result).toEqual({
                nameukr: "Тестовый товар",
                price: 125050,
                quantity: 15,
            });
            expect(mockedAxios.get).toHaveBeenCalledWith("https://sharik.ua/ua/search/?q=test-artikul");
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
            mockedAxios.get.mockResolvedValue({ data: mockHtml });
            const result = await getSharikData("test");
            expect(result?.price).toBe(2500.75);
        });
        it("должен правильно извлекать количество из текста", async () => {
            const mockHtml = `
        <div class="car-col">
          <div class="one-item">
            <div class="one-item-tit">Товар</div>
            <div class="one-item-price">100 грн</div>
            <div class="one-item-quantity">Осталось: 42 единицы</div>
          </div>
        </div>
      `;
            mockedAxios.get.mockResolvedValue({ data: mockHtml });
            const result = await getSharikData("test");
            expect(result?.quantity).toBe(42);
        });
    });
    describe("Сценарии когда товар не найден", () => {
        it("должен возвращать null когда нет товаров", async () => {
            const mockHtml = `<div class="car-col"></div>`;
            mockedAxios.get.mockResolvedValue({ data: mockHtml });
            const result = await getSharikData("nonexistent");
            expect(result).toBeNull();
        });
        it("должен возвращать null когда данные товара неполные", async () => {
            const mockHtml = `
        <div class="car-col">
          <div class="one-item">
            <div class="one-item-tit"></div>
            <div class="one-item-price">100 грн</div>
            <div class="one-item-quantity">10 шт</div>
          </div>
        </div>
      `;
            mockedAxios.get.mockResolvedValue({ data: mockHtml });
            const result = await getSharikData("test");
            expect(result).toBeNull();
        });
        it("должен возвращать null когда цена невалидна", async () => {
            const mockHtml = `
        <div class="car-col">
          <div class="one-item">
            <div class="one-item-tit">Товар</div>
            <div class="one-item-price">неверная цена</div>
            <div class="one-item-quantity">10 шт</div>
          </div>
        </div>
      `;
            mockedAxios.get.mockResolvedValue({ data: mockHtml });
            const result = await getSharikData("test");
            expect(result).toBeNull();
        });
        it("должен возвращать null когда количество невалидно", async () => {
            const mockHtml = `
        <div class="car-col">
          <div class="one-item">
            <div class="one-item-tit">Товар</div>
            <div class="one-item-price">100 грн</div>
            <div class="one-item-quantity">нет количества</div>
          </div>
        </div>
      `;
            mockedAxios.get.mockResolvedValue({ data: mockHtml });
            const result = await getSharikData("test");
            expect(result).toBeNull();
        });
    });
    describe("Обработка ошибок", () => {
        it("должен выбрасывать ошибку при ошибке axios", async () => {
            const error = new Error("Network error");
            mockedAxios.get.mockRejectedValue(error);
            await expect(getSharikData("test")).rejects.toThrow("Failed to fetch data from sharik.ua: Network error");
        });
        it("должен выбрасывать ошибку при неизвестной ошибке", async () => {
            mockedAxios.get.mockRejectedValue("Unknown error");
            await expect(getSharikData("test")).rejects.toThrow("Failed to fetch data from sharik.ua: Unknown error");
        });
        it("должен правильно кодировать артикул в URL", async () => {
            const mockHtml = `<div class="car-col"></div>`;
            mockedAxios.get.mockResolvedValue({ data: mockHtml });
            await getSharikData("тест с пробелами & символами");
            expect(mockedAxios.get).toHaveBeenCalledWith("https://sharik.ua/ua/search/?q=%D1%82%D0%B5%D1%81%D1%82%20%D1%81%20%D0%BF%D1%80%D0%BE%D0%B1%D0%B5%D0%BB%D0%B0%D0%BC%D0%B8%20%26%20%D1%81%D0%B8%D0%BC%D0%B2%D0%BE%D0%BB%D0%B0%D0%BC%D0%B8");
        });
    });
});
