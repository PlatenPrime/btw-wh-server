import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestArt } from "../../../../test/setup.js";
import { getArt } from "../getArt.js";
describe("getArt Controller", () => {
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
        vi.clearAllMocks();
    });
    it("should return art by artikul", async () => {
        // Arrange
        const testArt = await createTestArt({
            artikul: "5555-0001",
            nameukr: "Test Art",
            namerus: "Тест Арт",
            zone: "A1",
            limit: 100,
        });
        mockRequest = {
            params: { artikul: "5555-0001" },
        };
        // Act
        await getArt(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Art retrieved successfully");
        expect(responseJson.data.artikul).toBe("5555-0001");
        expect(responseJson.data.nameukr).toBe("Test Art");
        expect(responseJson.data.namerus).toBe("Тест Арт");
        expect(responseJson.data.zone).toBe("A1");
        expect(responseJson.data.limit).toBe(100);
        expect(responseJson.data._id).toBeDefined();
    });
    it("should return 200 with exists false when art not found", async () => {
        // Arrange
        mockRequest = {
            params: { artikul: "NONEXISTENT" },
        };
        // Act
        await getArt(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(false);
        expect(responseJson.message).toBe("Art not found");
        expect(responseJson.data).toBe(null);
    });
    it("should handle case-sensitive search", async () => {
        // Arrange
        await createTestArt({
            artikul: "Test123",
            nameukr: "Test Art",
            zone: "A1",
        });
        mockRequest = {
            params: { artikul: "test123" }, // Different case
        };
        // Act
        await getArt(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(false);
        expect(responseJson.message).toBe("Art not found");
        expect(responseJson.data).toBe(null);
    });
    it("should return art with btradeStock data", async () => {
        // Arrange
        const testArt = await createTestArt({
            artikul: "5555-0001",
            nameukr: "Test Art",
            zone: "A1",
            btradeStock: {
                value: 50,
                date: new Date("2024-01-01"),
            },
        });
        mockRequest = {
            params: { artikul: "5555-0001" },
        };
        // Act
        await getArt(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Art retrieved successfully");
        expect(responseJson.data.artikul).toBe("5555-0001");
        expect(responseJson.data.btradeStock).toBeDefined();
        expect(responseJson.data.btradeStock.value).toBe(50);
        expect(responseJson.data.btradeStock.date).toBeDefined();
    });
    it("should return art with marker", async () => {
        // Arrange
        const testArt = await createTestArt({
            artikul: "5555-0001",
            nameukr: "Test Art",
            zone: "A1",
            marker: "IMPORTANT",
        });
        mockRequest = {
            params: { artikul: "5555-0001" },
        };
        // Act
        await getArt(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Art retrieved successfully");
        expect(responseJson.data.artikul).toBe("5555-0001");
        expect(responseJson.data.marker).toBe("IMPORTANT");
    });
    it("should handle empty artikul parameter", async () => {
        // Arrange
        mockRequest = {
            params: { artikul: "" },
        };
        // Act
        await getArt(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(false);
        expect(responseJson.message).toBe("Art not found");
        expect(responseJson.data).toBe(null);
    });
    it("should handle special characters in artikul", async () => {
        // Arrange
        const testArt = await createTestArt({
            artikul: "TEST-123_ABC",
            nameukr: "Test Art",
            zone: "A1",
        });
        mockRequest = {
            params: { artikul: "TEST-123_ABC" },
        };
        // Act
        await getArt(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Art retrieved successfully");
        expect(responseJson.data.artikul).toBe("TEST-123_ABC");
    });
    it("should handle numeric artikul", async () => {
        // Arrange
        const testArt = await createTestArt({
            artikul: "123456",
            nameukr: "Test Art",
            zone: "A1",
        });
        mockRequest = {
            params: { artikul: "123456" },
        };
        // Act
        await getArt(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Art retrieved successfully");
        expect(responseJson.data.artikul).toBe("123456");
    });
    it("should return timestamps", async () => {
        // Arrange
        const testArt = await createTestArt({
            artikul: "TIMESTAMP_TEST",
            nameukr: "Test Art",
            zone: "A1",
        });
        mockRequest = {
            params: { artikul: "TIMESTAMP_TEST" },
        };
        // Act
        await getArt(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Art retrieved successfully");
        expect(responseJson.data.createdAt).toBeDefined();
        expect(responseJson.data.updatedAt).toBeDefined();
        expect(new Date(responseJson.data.createdAt)).toBeInstanceOf(Date);
        expect(new Date(responseJson.data.updatedAt)).toBeInstanceOf(Date);
    });
});
