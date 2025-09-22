import { beforeEach, describe, expect, it, vi } from "vitest";
// Mock axios and cheerio before importing the module
vi.mock("axios", () => ({
    default: {
        get: vi.fn(),
    },
}));
vi.mock("cheerio", () => ({
    load: vi.fn(),
}));
import axios from "axios";
import * as cheerio from "cheerio";
import { getSharikData } from "../getSharikData.js";
const mockedAxios = vi.mocked(axios);
const mockedCheerio = vi.mocked(cheerio);
describe("getSharikData", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it("should return product data for valid artikul", async () => {
        // Arrange
        const mockHtml = `
      <html>
        <body>
          <div class="car-col">
            <div class="one-item">
              <div class="one-item-tit">Test Product Name</div>
              <div class="one-item-price">1,250.50 грн</div>
              <div class="one-item-quantity">В наявності: 15 шт</div>
            </div>
          </div>
        </body>
      </html>
    `;
        const mockCheerioInstance = {
            find: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            text: vi.fn().mockReturnValue(""),
        };
        mockedAxios.get.mockResolvedValue({ data: mockHtml });
        mockedCheerio.load.mockReturnValue(mockCheerioInstance);
        // Mock the cheerio chain
        mockCheerioInstance.find.mockImplementation((selector) => {
            if (selector === ".car-col .one-item") {
                return {
                    length: 1,
                    eq: () => ({
                        find: (sel) => {
                            if (sel === ".one-item-tit")
                                return { text: () => "Test Product Name" };
                            if (sel === ".one-item-price")
                                return { text: () => "1,250.50 грн" };
                            if (sel === ".one-item-quantity")
                                return { text: () => "В наявності: 15 шт" };
                            return { text: () => "" };
                        },
                    }),
                };
            }
            return { text: () => "" };
        });
        // Act
        const result = await getSharikData("TEST123");
        // Assert
        expect(result).toEqual({
            nameukr: "Test Product Name",
            price: 1250.5,
            quantity: 15,
        });
        expect(mockedAxios.get).toHaveBeenCalledWith("https://sharik.ua/ua/search/?q=TEST123");
    });
    it("should return null when no products found", async () => {
        // Arrange
        const mockHtml = `
      <html>
        <body>
          <div class="car-col">
            <!-- No products -->
          </div>
        </body>
      </html>
    `;
        const mockCheerioInstance = {
            find: vi.fn().mockReturnValue({ length: 0 }),
        };
        mockedAxios.get.mockResolvedValue({ data: mockHtml });
        mockedCheerio.load.mockReturnValue(mockCheerioInstance);
        // Act
        const result = await getSharikData("NONEXISTENT");
        // Assert
        expect(result).toBeNull();
    });
    it("should return null when product data is incomplete", async () => {
        // Arrange
        const mockHtml = `
      <html>
        <body>
          <div class="car-col">
            <div class="one-item">
              <div class="one-item-tit">Test Product</div>
              <!-- Missing price and quantity -->
            </div>
          </div>
        </body>
      </html>
    `;
        const mockCheerioInstance = {
            find: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            text: vi.fn().mockReturnValue(""),
        };
        mockedAxios.get.mockResolvedValue({ data: mockHtml });
        mockedCheerio.load.mockReturnValue(mockCheerioInstance);
        // Mock the cheerio chain
        mockCheerioInstance.find.mockImplementation((selector) => {
            if (selector === ".car-col .one-item") {
                return {
                    length: 1,
                    eq: () => ({
                        find: (sel) => {
                            if (sel === ".one-item-tit")
                                return { text: () => "Test Product" };
                            if (sel === ".one-item-price")
                                return { text: () => "" };
                            if (sel === ".one-item-quantity")
                                return { text: () => "" };
                            return { text: () => "" };
                        },
                    }),
                };
            }
            return { text: () => "" };
        });
        // Act
        const result = await getSharikData("INCOMPLETE");
        // Assert
        expect(result).toBeNull();
    });
    it("should handle different price formats", async () => {
        // Arrange
        const mockHtml = `
      <html>
        <body>
          <div class="car-col">
            <div class="one-item">
              <div class="one-item-tit">Test Product</div>
              <div class="one-item-price">2,500 грн</div>
              <div class="one-item-quantity">В наявності: 10 шт</div>
            </div>
          </div>
        </body>
      </html>
    `;
        const mockCheerioInstance = {
            find: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            text: vi.fn().mockReturnValue(""),
        };
        mockedAxios.get.mockResolvedValue({ data: mockHtml });
        mockedCheerio.load.mockReturnValue(mockCheerioInstance);
        // Mock the cheerio chain
        mockCheerioInstance.find.mockImplementation((selector) => {
            if (selector === ".car-col .one-item") {
                return {
                    length: 1,
                    eq: () => ({
                        find: (sel) => {
                            if (sel === ".one-item-tit")
                                return { text: () => "Test Product" };
                            if (sel === ".one-item-price")
                                return { text: () => "2,500 грн" };
                            if (sel === ".one-item-quantity")
                                return { text: () => "В наявності: 10 шт" };
                            return { text: () => "" };
                        },
                    }),
                };
            }
            return { text: () => "" };
        });
        // Act
        const result = await getSharikData("PRICE_TEST");
        // Assert
        expect(result?.price).toBe(2500);
    });
    it("should handle different quantity formats", async () => {
        // Arrange
        const mockHtml = `
      <html>
        <body>
          <div class="car-col">
            <div class="one-item">
              <div class="one-item-tit">Test Product</div>
              <div class="one-item-price">100 грн</div>
              <div class="one-item-quantity">Кількість: 25 pieces</div>
            </div>
          </div>
        </body>
      </html>
    `;
        const mockCheerioInstance = {
            find: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            text: vi.fn().mockReturnValue(""),
        };
        mockedAxios.get.mockResolvedValue({ data: mockHtml });
        mockedCheerio.load.mockReturnValue(mockCheerioInstance);
        // Mock the cheerio chain
        mockCheerioInstance.find.mockImplementation((selector) => {
            if (selector === ".car-col .one-item") {
                return {
                    length: 1,
                    eq: () => ({
                        find: (sel) => {
                            if (sel === ".one-item-tit")
                                return { text: () => "Test Product" };
                            if (sel === ".one-item-price")
                                return { text: () => "100 грн" };
                            if (sel === ".one-item-quantity")
                                return { text: () => "Кількість: 25 pieces" };
                            return { text: () => "" };
                        },
                    }),
                };
            }
            return { text: () => "" };
        });
        // Act
        const result = await getSharikData("QUANTITY_TEST");
        // Assert
        expect(result?.quantity).toBe(25);
    });
    it("should throw error for invalid artikul", async () => {
        // Act & Assert
        await expect(getSharikData("")).rejects.toThrow("Artikul is required and must be a string");
        await expect(getSharikData(null)).rejects.toThrow("Artikul is required and must be a string");
        await expect(getSharikData(undefined)).rejects.toThrow("Artikul is required and must be a string");
    });
    it("should throw error when axios fails", async () => {
        // Arrange
        mockedAxios.get.mockRejectedValue(new Error("Network error"));
        // Act & Assert
        await expect(getSharikData("ERROR_TEST")).rejects.toThrow("Failed to fetch data from sharik.ua: Network error");
    });
    it("should handle special characters in artikul", async () => {
        // Arrange
        const mockHtml = `
      <html>
        <body>
          <div class="car-col">
            <div class="one-item">
              <div class="one-item-tit">Special Product</div>
              <div class="one-item-price">100 грн</div>
              <div class="one-item-quantity">В наявності: 5 шт</div>
            </div>
          </div>
        </body>
      </html>
    `;
        const mockCheerioInstance = {
            find: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            text: vi.fn().mockReturnValue(""),
        };
        mockedAxios.get.mockResolvedValue({ data: mockHtml });
        mockedCheerio.load.mockReturnValue(mockCheerioInstance);
        // Mock the cheerio chain
        mockCheerioInstance.find.mockImplementation((selector) => {
            if (selector === ".car-col .one-item") {
                return {
                    length: 1,
                    eq: () => ({
                        find: (sel) => {
                            if (sel === ".one-item-tit")
                                return { text: () => "Special Product" };
                            if (sel === ".one-item-price")
                                return { text: () => "100 грн" };
                            if (sel === ".one-item-quantity")
                                return { text: () => "В наявності: 5 шт" };
                            return { text: () => "" };
                        },
                    }),
                };
            }
            return { text: () => "" };
        });
        // Act
        const result = await getSharikData("SPECIAL-123_ABC");
        // Assert
        expect(result).toEqual({
            nameukr: "Special Product",
            price: 100,
            quantity: 5,
        });
        expect(mockedAxios.get).toHaveBeenCalledWith("https://sharik.ua/ua/search/?q=SPECIAL-123_ABC");
    });
});
