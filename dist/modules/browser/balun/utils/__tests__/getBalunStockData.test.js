import { beforeEach, describe, expect, it, vi } from "vitest";
import { getBalunStockData } from "../getBalunStockData.js";
import { browserGet } from "../../../utils/browserRequest.js";
vi.mock("../../../utils/browserRequest.js");
const validFbProductData = '{"content_ids":[1341820466],"contents":[{"id":1341820466,"quantity":10000}],"value":0.04,"currency":"USD"}';
const validAnalyticsData = '{"clerk":{"price_original":"1.58","product_id":"1341820466"}}';
describe("getBalunStockData", () => {
    beforeEach(() => {
        vi.mocked(browserGet).mockReset();
    });
    describe("Валидация входных данных", () => {
        it("должен выбрасывать ошибку при пустой ссылке", async () => {
            await expect(getBalunStockData("")).rejects.toThrow("Link is required and must be a string");
        });
        it("должен выбрасывать ошибку при null", async () => {
            await expect(getBalunStockData(null)).rejects.toThrow("Link is required and must be a string");
        });
        it("должен выбрасывать ошибку при undefined", async () => {
            await expect(getBalunStockData(undefined)).rejects.toThrow("Link is required and must be a string");
        });
        it("должен выбрасывать ошибку при не-строковом link", async () => {
            await expect(getBalunStockData(123)).rejects.toThrow("Link is required and must be a string");
        });
    });
    describe("Успешные сценарии", () => {
        it("должен возвращать { stock, price } при успешном парсинге", async () => {
            const mockHtml = `
        <div data-advtracking-fb-product-data='${validFbProductData}'></div>
        <div data-analytics='${validAnalyticsData}'></div>
      `;
            vi.mocked(browserGet).mockResolvedValue(mockHtml);
            const result = await getBalunStockData("https://example.com/product/1341820466");
            expect(result).toEqual({ stock: 10000, price: 1.58 });
            expect(browserGet).toHaveBeenCalledWith("https://example.com/product/1341820466");
        });
        it("должен обрабатывать цену с запятой", async () => {
            const mockHtml = `
        <div data-advtracking-fb-product-data='{"contents":[{"quantity":5}]}'></div>
        <div data-analytics='{"clerk":{"price_original":"12,34"}}'></div>
      `;
            vi.mocked(browserGet).mockResolvedValue(mockHtml);
            const result = await getBalunStockData("https://example.com/product/1");
            expect(result).toEqual({ stock: 5, price: 12.34 });
        });
    });
    describe("Отсутствие ключа stock — присваивать 0", () => {
        it("должен возвращать stock: 0 при отсутствии data-advtracking-fb-product-data", async () => {
            const mockHtml = `
        <div data-analytics='${validAnalyticsData}'></div>
      `;
            vi.mocked(browserGet).mockResolvedValue(mockHtml);
            const result = await getBalunStockData("https://example.com/product/1");
            expect(result).toEqual({ stock: 0, price: 1.58 });
        });
        it("должен возвращать stock: 0 при пустом contents", async () => {
            const mockHtml = `
        <div data-advtracking-fb-product-data='{"contents":[]}'></div>
        <div data-analytics='${validAnalyticsData}'></div>
      `;
            vi.mocked(browserGet).mockResolvedValue(mockHtml);
            const result = await getBalunStockData("https://example.com/product/1");
            expect(result).toEqual({ stock: 0, price: 1.58 });
        });
        it("должен возвращать stock: 0 при отсутствии quantity в contents[0]", async () => {
            const mockHtml = `
        <div data-advtracking-fb-product-data='{"contents":[{"id":123}]}'></div>
        <div data-analytics='${validAnalyticsData}'></div>
      `;
            vi.mocked(browserGet).mockResolvedValue(mockHtml);
            const result = await getBalunStockData("https://example.com/product/1");
            expect(result).toEqual({ stock: 0, price: 1.58 });
        });
    });
    describe("Отсутствие или невалидные данные price", () => {
        it("должен возвращать null когда нет data-analytics", async () => {
            const mockHtml = `
        <div data-advtracking-fb-product-data='${validFbProductData}'></div>
      `;
            vi.mocked(browserGet).mockResolvedValue(mockHtml);
            const result = await getBalunStockData("https://example.com/product/1");
            expect(result).toBeNull();
        });
        it("должен возвращать null когда clerk.price_original отсутствует", async () => {
            const mockHtml = `
        <div data-advtracking-fb-product-data='${validFbProductData}'></div>
        <div data-analytics='{"clerk":{}}'></div>
      `;
            vi.mocked(browserGet).mockResolvedValue(mockHtml);
            const result = await getBalunStockData("https://example.com/product/1");
            expect(result).toBeNull();
        });
        it("должен возвращать null когда цена нечисловая", async () => {
            const mockHtml = `
        <div data-advtracking-fb-product-data='${validFbProductData}'></div>
        <div data-analytics='{"clerk":{"price_original":"немає"}}'></div>
      `;
            vi.mocked(browserGet).mockResolvedValue(mockHtml);
            const result = await getBalunStockData("https://example.com/product/1");
            expect(result).toBeNull();
        });
    });
    describe("Обработка ошибок", () => {
        it("должен выбрасывать ошибку при ошибке сети", async () => {
            vi.mocked(browserGet).mockRejectedValue(new Error("Network error"));
            await expect(getBalunStockData("https://example.com/product/1")).rejects.toThrow("Failed to fetch data from balun: Network error");
        });
    });
});
