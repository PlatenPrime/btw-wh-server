import { beforeEach, describe, expect, it, vi } from "vitest";
// Mock the getSharikData utility
const mockGetSharikData = vi.fn();
vi.mock("../../../utils/index.js", () => ({
    getSharikData: mockGetSharikData,
}));
import { getBtradeArtInfo } from "../getBtradeInfo.js";
describe("getBtradeArtInfo Controller (Fixed)", () => {
    let mockRequest;
    let responseJson;
    let responseStatus;
    let res;
    beforeEach(() => {
        responseJson = {};
        responseStatus = {};
        res = {
            status: function (code) {
                responseStatus.code = code;
                return this;
            },
            json: function (data) {
                responseJson = data;
                return this;
            },
        };
        // Reset mocks
        vi.clearAllMocks();
    });
    it("should return product info for valid artikul", async () => {
        // Arrange
        const mockProductData = {
            nameukr: "Test Product Name",
            price: 1250.5,
            quantity: 15,
        };
        mockGetSharikData.mockResolvedValue(mockProductData);
        mockRequest = {
            params: { artikul: "TEST123" },
        };
        // Act
        await getBtradeArtInfo(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson).toEqual(mockProductData);
        expect(mockGetSharikData).toHaveBeenCalledWith("TEST123");
    });
    it("should return 400 when artikul is missing", async () => {
        // Arrange
        mockRequest = {
            params: {},
        };
        // Act
        await getBtradeArtInfo(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Artikul is required");
    });
    it("should return 400 when artikul is empty", async () => {
        // Arrange
        mockRequest = {
            params: { artikul: "" },
        };
        // Act
        await getBtradeArtInfo(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Artikul is required");
    });
    it("should return 404 when no products found", async () => {
        // Arrange
        mockGetSharikData.mockResolvedValue(null);
        mockRequest = {
            params: { artikul: "NONEXISTENT" },
        };
        // Act
        await getBtradeArtInfo(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("No products found for this artikul");
        expect(mockGetSharikData).toHaveBeenCalledWith("NONEXISTENT");
    });
    it("should handle getSharikData error", async () => {
        // Arrange
        mockGetSharikData.mockRejectedValue(new Error("Network error"));
        mockRequest = {
            params: { artikul: "ERROR_TEST" },
        };
        // Act
        await getBtradeArtInfo(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Failed to fetch data from sharik.ua");
        expect(responseJson.error).toBe("Network error");
        expect(mockGetSharikData).toHaveBeenCalledWith("ERROR_TEST");
    });
    it("should handle special characters in artikul", async () => {
        // Arrange
        const mockProductData = {
            nameukr: "Special Product",
            price: 100,
            quantity: 5,
        };
        mockGetSharikData.mockResolvedValue(mockProductData);
        mockRequest = {
            params: { artikul: "SPECIAL-123_ABC" },
        };
        // Act
        await getBtradeArtInfo(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson).toEqual(mockProductData);
        expect(mockGetSharikData).toHaveBeenCalledWith("SPECIAL-123_ABC");
    });
    it("should handle Ukrainian characters in product name", async () => {
        // Arrange
        const mockProductData = {
            nameukr: "Українська назва з їїї",
            price: 200,
            quantity: 10,
        };
        mockGetSharikData.mockResolvedValue(mockProductData);
        mockRequest = {
            params: { artikul: "UKRAINIAN" },
        };
        // Act
        await getBtradeArtInfo(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson).toEqual(mockProductData);
        expect(mockGetSharikData).toHaveBeenCalledWith("UKRAINIAN");
    });
});
