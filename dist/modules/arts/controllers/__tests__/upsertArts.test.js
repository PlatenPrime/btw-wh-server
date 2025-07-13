import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestArt } from "../../../../test/setup.js";
import { upsertArts } from "../upsertArts.js";
describe("upsertArts Controller", () => {
    let mockRequest;
    let responseJson;
    let responseStatus;
    let res;
    let mockNext;
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
        mockNext = vi.fn();
        vi.clearAllMocks();
    });
    it("should create new arts when they don't exist", async () => {
        // Arrange
        const artsData = [
            {
                artikul: "NEW001",
                nameukr: "New Art 1",
                namerus: "Новый Арт 1",
                zone: "A1",
            },
            {
                artikul: "NEW002",
                nameukr: "New Art 2",
                namerus: "Новый Арт 2",
                zone: "A2",
            },
        ];
        mockRequest = {
            body: artsData,
        };
        // Act
        await upsertArts(mockRequest, res, mockNext);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Upsert completed");
        expect(responseJson.result).toBeDefined();
        expect(responseJson.result.upsertedCount).toBe(2);
        expect(responseJson.result.modifiedCount).toBe(0);
    });
    it("should update existing arts", async () => {
        // Arrange
        const existingArt = await createTestArt({
            artikul: "EXIST001",
            nameukr: "Old Name",
            namerus: "Старое имя",
            zone: "A1",
        });
        const updateData = [
            {
                artikul: "EXIST001",
                nameukr: "Updated Name",
                namerus: "Обновленное имя",
                zone: "A2",
            },
        ];
        mockRequest = {
            body: updateData,
        };
        // Act
        await upsertArts(mockRequest, res, mockNext);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Upsert completed");
        expect(responseJson.result).toBeDefined();
        expect(responseJson.result.upsertedCount).toBe(0);
        expect(responseJson.result.modifiedCount).toBe(1);
    });
    it("should handle mixed create and update operations", async () => {
        // Arrange
        const existingArt = await createTestArt({
            artikul: "MIXED001",
            nameukr: "Existing Art",
            zone: "A1",
        });
        const mixedData = [
            {
                artikul: "MIXED001", // Update existing
                nameukr: "Updated Existing Art",
                zone: "A2",
            },
            {
                artikul: "MIXED002", // Create new
                nameukr: "New Mixed Art",
                zone: "A3",
            },
        ];
        mockRequest = {
            body: mixedData,
        };
        // Act
        await upsertArts(mockRequest, res, mockNext);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Upsert completed");
        expect(responseJson.result).toBeDefined();
        expect(responseJson.result.upsertedCount).toBe(1);
        expect(responseJson.result.modifiedCount).toBe(1);
    });
    it("should return 400 for empty array", async () => {
        // Arrange
        mockRequest = {
            body: [],
        };
        // Act
        await upsertArts(mockRequest, res, mockNext);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Invalid or empty data");
    });
    it("should return 400 for non-array data", async () => {
        // Arrange
        mockRequest = {
            body: "not an array",
        };
        // Act
        await upsertArts(mockRequest, res, mockNext);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Invalid or empty data");
    });
    it("should return 400 for null body", async () => {
        // Arrange
        mockRequest = {
            body: null,
        };
        // Act
        await upsertArts(mockRequest, res, mockNext);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Invalid or empty data");
    });
    it("should handle large batch of arts", async () => {
        // Arrange
        const largeBatch = [];
        for (let i = 1; i <= 50; i++) {
            largeBatch.push({
                artikul: `BATCH${i.toString().padStart(3, "0")}`,
                nameukr: `Batch Art ${i}`,
                namerus: `Пакет Арт ${i}`,
                zone: `A${(i % 5) + 1}`,
            });
        }
        mockRequest = {
            body: largeBatch,
        };
        // Act
        await upsertArts(mockRequest, res, mockNext);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Upsert completed");
        expect(responseJson.result.upsertedCount).toBe(50);
    });
    it("should handle arts with missing optional fields", async () => {
        // Arrange
        const minimalData = [
            {
                artikul: "MINIMAL001",
                zone: "A1",
                // Missing nameukr and namerus
            },
        ];
        mockRequest = {
            body: minimalData,
        };
        // Act
        await upsertArts(mockRequest, res, mockNext);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Upsert completed");
        expect(responseJson.result.upsertedCount).toBe(1);
    });
    it("should handle duplicate artikuls in the same batch", async () => {
        // Arrange
        const duplicateData = [
            {
                artikul: "DUPLICATE001",
                nameukr: "First Entry",
                zone: "A1",
            },
            {
                artikul: "DUPLICATE001", // Same artikul
                nameukr: "Second Entry",
                zone: "A2",
            },
        ];
        mockRequest = {
            body: duplicateData,
        };
        // Act
        await upsertArts(mockRequest, res, mockNext);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Upsert completed");
        // Should create one and update it with the second entry
        expect(responseJson.result.upsertedCount).toBe(1);
        expect(responseJson.result.modifiedCount).toBe(1);
    });
    it("should handle special characters in artikul", async () => {
        // Arrange
        const specialData = [
            {
                artikul: "SPECIAL-123_ABC",
                nameukr: "Special Art",
                zone: "A1",
            },
        ];
        mockRequest = {
            body: specialData,
        };
        // Act
        await upsertArts(mockRequest, res, mockNext);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Upsert completed");
        expect(responseJson.result.upsertedCount).toBe(1);
    });
    it("should handle unicode characters in names", async () => {
        // Arrange
        const unicodeData = [
            {
                artikul: "UNICODE001",
                nameukr: "Українська назва з їїї",
                namerus: "Русское название с ёёё",
                zone: "A1",
            },
        ];
        mockRequest = {
            body: unicodeData,
        };
        // Act
        await upsertArts(mockRequest, res, mockNext);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Upsert completed");
        expect(responseJson.result.upsertedCount).toBe(1);
    });
    it("should preserve existing fields not in update", async () => {
        // Arrange
        const existingArt = await createTestArt({
            artikul: "PRESERVE001",
            nameukr: "Original Name",
            namerus: "Оригинальное имя",
            zone: "A1",
            limit: 100,
            marker: "IMPORTANT",
        });
        const updateData = [
            {
                artikul: "PRESERVE001",
                nameukr: "Updated Name",
                zone: "A2",
                // Not updating namerus, limit, marker
            },
        ];
        mockRequest = {
            body: updateData,
        };
        // Act
        await upsertArts(mockRequest, res, mockNext);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Upsert completed");
        expect(responseJson.result.modifiedCount).toBe(1);
        // Verify the art was updated correctly
        const Art = mongoose.model("Art");
        const updatedArt = await Art.findOne({ artikul: "PRESERVE001" });
        expect(updatedArt?.nameukr).toBe("Updated Name");
        expect(updatedArt?.zone).toBe("A2");
        expect(updatedArt?.namerus).toBe("Оригинальное имя"); // Should be preserved
        expect(updatedArt?.limit).toBe(100); // Should be preserved
        expect(updatedArt?.marker).toBe("IMPORTANT"); // Should be preserved
    });
});
