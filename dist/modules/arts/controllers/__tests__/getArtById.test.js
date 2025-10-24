import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestArt } from "../../../../test/setup.js";
import { getArtById } from "../getArtById.js";
describe("getArtById Controller", () => {
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
    it("should return art by valid ObjectId", async () => {
        // Arrange
        const testArt = await createTestArt({
            artikul: "TEST123",
            nameukr: "Test Art",
            namerus: "Тест Арт",
            zone: "A1",
            limit: 100,
        });
        mockRequest = {
            params: { id: testArt._id.toString() },
        };
        // Act
        await getArtById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Art retrieved successfully");
        expect(responseJson.data.artikul).toBe("TEST123");
        expect(responseJson.data.nameukr).toBe("Test Art");
        expect(responseJson.data.namerus).toBe("Тест Арт");
        expect(responseJson.data.zone).toBe("A1");
        expect(responseJson.data.limit).toBe(100);
        expect(responseJson.data._id).toBeDefined();
    });
    it("should return 200 with exists false when art not found", async () => {
        // Arrange
        const nonExistentId = new mongoose.Types.ObjectId();
        mockRequest = {
            params: { id: nonExistentId.toString() },
        };
        // Act
        await getArtById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(false);
        expect(responseJson.message).toBe("Art not found");
        expect(responseJson.data).toBe(null);
    });
    it("should return 500 for invalid ObjectId format", async () => {
        // Arrange
        mockRequest = {
            params: { id: "invalid-id-format" },
        };
        // Act
        await getArtById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
    });
    it("should return art with btradeStock data", async () => {
        // Arrange
        const testArt = await createTestArt({
            artikul: "TEST456",
            nameukr: "Test Art",
            zone: "A1",
            btradeStock: {
                value: 75,
                date: new Date("2024-01-15"),
            },
        });
        mockRequest = {
            params: { id: testArt._id.toString() },
        };
        // Act
        await getArtById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Art retrieved successfully");
        expect(responseJson.data.artikul).toBe("TEST456");
        expect(responseJson.data.btradeStock).toBeDefined();
        expect(responseJson.data.btradeStock.value).toBe(75);
        expect(responseJson.data.btradeStock.date).toBeDefined();
    });
    it("should return art with marker", async () => {
        // Arrange
        const testArt = await createTestArt({
            artikul: "TEST789",
            nameukr: "Test Art",
            zone: "A1",
            marker: "URGENT",
        });
        mockRequest = {
            params: { id: testArt._id.toString() },
        };
        // Act
        await getArtById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Art retrieved successfully");
        expect(responseJson.data.artikul).toBe("TEST789");
        expect(responseJson.data.marker).toBe("URGENT");
    });
    it("should handle empty id parameter", async () => {
        // Arrange
        mockRequest = {
            params: { id: "" },
        };
        // Act
        await getArtById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("ID is required");
    });
    it("should handle undefined id parameter", async () => {
        // Arrange
        mockRequest = {
            params: {},
        };
        // Act
        await getArtById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("ID is required");
    });
    it("should return timestamps", async () => {
        // Arrange
        const testArt = await createTestArt({
            artikul: "TIMESTAMP_TEST",
            nameukr: "Test Art",
            zone: "A1",
        });
        mockRequest = {
            params: { id: testArt._id.toString() },
        };
        // Act
        await getArtById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Art retrieved successfully");
        expect(responseJson.data.createdAt).toBeDefined();
        expect(responseJson.data.updatedAt).toBeDefined();
        expect(new Date(responseJson.data.createdAt)).toBeInstanceOf(Date);
        expect(new Date(responseJson.data.updatedAt)).toBeInstanceOf(Date);
    });
    it("should handle art with minimal required fields", async () => {
        // Arrange
        const testArt = await createTestArt({
            artikul: "MINIMAL",
            zone: "A1",
            // Only required fields
        });
        mockRequest = {
            params: { id: testArt._id.toString() },
        };
        // Act
        await getArtById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Art retrieved successfully");
        expect(responseJson.data.artikul).toBe("MINIMAL");
        expect(responseJson.data.zone).toBe("A1");
        // Optional fields may be undefined or have default values from createTestArt
        expect(responseJson.data._id).toBeDefined();
    });
    it("should handle very long ObjectId", async () => {
        // Arrange
        const longId = "507f1f77bcf86cd799439011"; // Valid 24-character ObjectId
        mockRequest = {
            params: { id: longId },
        };
        // Act
        await getArtById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(false);
        expect(responseJson.message).toBe("Art not found");
        expect(responseJson.data).toBe(null);
    });
});
