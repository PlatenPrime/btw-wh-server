import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestArt } from "../../../../test/setup.js";
import { Art } from "../../models/Art.js";
import { updateArtLimit } from "../updateArtLimit.js";
describe("updateArtLimit Controller", () => {
    let mockRequest;
    let responseJson;
    let responseStatus;
    let res;
    let testArt;
    beforeEach(async () => {
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
        // Create test art
        testArt = await createTestArt({
            artikul: "TEST001",
            nameukr: "Test Art",
            namerus: "Тестовый арт",
            zone: "A1",
            limit: 50,
            marker: "TEST",
        });
        vi.clearAllMocks();
    });
    it("should successfully update limit with valid data", async () => {
        // Arrange
        mockRequest = {
            params: { id: testArt._id },
            body: { limit: 100 },
        };
        // Act
        await updateArtLimit(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson._id).toStrictEqual(testArt._id);
        expect(responseJson.artikul).toBe("TEST001");
        expect(responseJson.nameukr).toBe("Test Art");
        expect(responseJson.namerus).toBe("Тестовый арт");
        expect(responseJson.zone).toBe("A1");
        expect(responseJson.limit).toBe(100);
        expect(responseJson.marker).toBe("TEST");
        expect(responseJson.createdAt).toBeDefined();
        expect(responseJson.updatedAt).toBeDefined();
    });
    it("should update limit to zero", async () => {
        // Arrange
        mockRequest = {
            params: { id: testArt._id },
            body: { limit: 0 },
        };
        // Act
        await updateArtLimit(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.limit).toBe(0);
    });
    it("should update limit with large number", async () => {
        // Arrange
        mockRequest = {
            params: { id: testArt._id },
            body: { limit: 999999 },
        };
        // Act
        await updateArtLimit(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.limit).toBe(999999);
    });
    it("should preserve other fields when updating limit", async () => {
        // Arrange
        const artWithMoreFields = await createTestArt({
            artikul: "PRESERVE001",
            nameukr: "Preserve Test",
            namerus: "Тест сохранения",
            zone: "B2",
            limit: 25,
            marker: "IMPORTANT",
            btradeStock: {
                value: 100,
                date: new Date(),
            },
        });
        mockRequest = {
            params: { id: artWithMoreFields._id },
            body: { limit: 75 },
        };
        // Act
        await updateArtLimit(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.artikul).toBe("PRESERVE001");
        expect(responseJson.nameukr).toBe("Preserve Test");
        expect(responseJson.namerus).toBe("Тест сохранения");
        expect(responseJson.zone).toBe("B2");
        expect(responseJson.limit).toBe(75);
        expect(responseJson.marker).toBe("IMPORTANT");
        expect(responseJson.btradeStock).toBeDefined();
    });
    it("should return 400 when limit is missing", async () => {
        // Arrange
        mockRequest = {
            params: { id: testArt._id },
            body: {},
        };
        // Act
        await updateArtLimit(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("limit is required");
    });
    it("should return 400 when limit is null", async () => {
        // Arrange
        mockRequest = {
            params: { id: testArt._id },
            body: { limit: null },
        };
        // Act
        await updateArtLimit(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("limit is required");
    });
    it("should return 400 when limit is undefined", async () => {
        // Arrange
        mockRequest = {
            params: { id: testArt._id },
            body: { limit: undefined },
        };
        // Act
        await updateArtLimit(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("limit is required");
    });
    it("should return 400 when limit is negative", async () => {
        // Arrange
        mockRequest = {
            params: { id: testArt._id },
            body: { limit: -10 },
        };
        // Act
        await updateArtLimit(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("limit must be a non-negative number");
    });
    it("should return 400 when limit is not a number", async () => {
        // Arrange
        mockRequest = {
            params: { id: testArt._id },
            body: { limit: "not a number" },
        };
        // Act
        await updateArtLimit(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("limit must be a non-negative number");
    });
    it("should return 400 when limit is a string number", async () => {
        // Arrange
        mockRequest = {
            params: { id: testArt._id },
            body: { limit: "123" },
        };
        // Act
        await updateArtLimit(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("limit must be a non-negative number");
    });
    it("should return 400 when limit is boolean", async () => {
        // Arrange
        mockRequest = {
            params: { id: testArt._id },
            body: { limit: true },
        };
        // Act
        await updateArtLimit(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("limit must be a non-negative number");
    });
    it("should return 404 when art not found", async () => {
        // Arrange
        const nonExistentId = new mongoose.Types.ObjectId();
        mockRequest = {
            params: { id: nonExistentId.toString() },
            body: { limit: 100 },
        };
        // Act
        await updateArtLimit(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Art not found");
    });
    it("should handle invalid ObjectId format", async () => {
        // Arrange
        mockRequest = {
            params: { id: "invalid-id" },
            body: { limit: 100 },
        };
        // Act
        await updateArtLimit(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
    });
    it("should handle database error gracefully", async () => {
        // Arrange
        const originalFindByIdAndUpdate = Art.findByIdAndUpdate;
        vi.spyOn(Art, "findByIdAndUpdate").mockRejectedValueOnce(new Error("Database connection failed"));
        mockRequest = {
            params: { id: testArt._id },
            body: { limit: 100 },
        };
        // Act
        await updateArtLimit(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
        // Restore original method
        Art.findByIdAndUpdate = originalFindByIdAndUpdate;
    });
    it("should handle findById error gracefully", async () => {
        // Arrange
        const originalFindById = Art.findById;
        vi.spyOn(Art, "findById").mockRejectedValueOnce(new Error("Database connection failed"));
        mockRequest = {
            params: { id: testArt._id },
            body: { limit: 100 },
        };
        // Act
        await updateArtLimit(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
        // Restore original method
        Art.findById = originalFindById;
    });
    it("should handle update failure", async () => {
        // Arrange
        const originalFindByIdAndUpdate = Art.findByIdAndUpdate;
        vi.spyOn(Art, "findByIdAndUpdate").mockResolvedValueOnce(null);
        mockRequest = {
            params: { id: testArt._id },
            body: { limit: 100 },
        };
        // Act
        await updateArtLimit(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Failed to update art limit");
        // Restore original method
        Art.findByIdAndUpdate = originalFindByIdAndUpdate;
    });
    it("should handle decimal numbers", async () => {
        // Arrange
        mockRequest = {
            params: { id: testArt._id },
            body: { limit: 99.99 },
        };
        // Act
        await updateArtLimit(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.limit).toBe(99.99);
    });
    it("should handle very small decimal numbers", async () => {
        // Arrange
        mockRequest = {
            params: { id: testArt._id },
            body: { limit: 0.001 },
        };
        // Act
        await updateArtLimit(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.limit).toBe(0.001);
    });
    it("should handle empty request body", async () => {
        // Arrange
        mockRequest = {
            params: { id: testArt._id },
            body: null,
        };
        // Act
        await updateArtLimit(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
    });
    it("should handle multiple concurrent updates", async () => {
        // Arrange
        const art1 = await createTestArt({
            artikul: "CONCURRENT001",
            zone: "A1",
            limit: 10,
        });
        const art2 = await createTestArt({
            artikul: "CONCURRENT002",
            zone: "A2",
            limit: 20,
        });
        // Act - Update first art
        mockRequest = {
            params: { id: art1._id },
            body: { limit: 100 },
        };
        await updateArtLimit(mockRequest, res);
        // Assert first update
        expect(responseStatus.code).toBe(200);
        expect(responseJson.limit).toBe(100);
        // Update second art
        mockRequest = {
            params: { id: art2._id },
            body: { limit: 200 },
        };
        await updateArtLimit(mockRequest, res);
        // Assert second update
        expect(responseStatus.code).toBe(200);
        expect(responseJson.limit).toBe(200);
    });
    it("should handle art with no existing limit field", async () => {
        // Arrange
        const artWithoutLimit = await createTestArt({
            artikul: "NOLIMIT001",
            nameukr: "No Limit Art",
            zone: "A1",
            // No limit field
        });
        mockRequest = {
            params: { id: artWithoutLimit._id },
            body: { limit: 50 },
        };
        // Act
        await updateArtLimit(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.limit).toBe(50);
    });
    it("should update limit multiple times for same art", async () => {
        // Arrange
        mockRequest = {
            params: { id: testArt._id },
            body: { limit: 100 },
        };
        // Act - First update
        await updateArtLimit(mockRequest, res);
        expect(responseJson.limit).toBe(100);
        // Second update
        mockRequest = {
            params: { id: testArt._id },
            body: { limit: 200 },
        };
        await updateArtLimit(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.limit).toBe(200);
    });
});
