import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestZone } from "../../../../test/setup.js";
import { createZone } from "../createZone.js";
describe("createZone Controller", () => {
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
    it("should create zone with all required fields", async () => {
        // Arrange
        mockRequest = {
            body: {
                title: "42-5-2",
                bar: 420502,
                sector: 0,
            },
        };
        // Act
        await createZone(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(201);
        expect(responseJson.message).toBe("Zone created successfully");
        expect(responseJson.data.title).toBe("42-5-2");
        expect(responseJson.data.bar).toBe(420502);
        expect(responseJson.data.sector).toBe(0);
        expect(responseJson.data._id).toBeDefined();
        expect(responseJson.data.createdAt).toBeDefined();
        expect(responseJson.data.updatedAt).toBeDefined();
    });
    it("should create zone with minimal required fields", async () => {
        // Arrange
        mockRequest = {
            body: {
                title: "42-1",
                bar: 4201,
                // sector defaults to 0
            },
        };
        // Act
        await createZone(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(201);
        expect(responseJson.data.title).toBe("42-1");
        expect(responseJson.data.bar).toBe(4201);
        expect(responseJson.data.sector).toBe(0);
    });
    it("should return 400 for invalid title format", async () => {
        // Arrange
        mockRequest = {
            body: {
                title: "invalid-title-format",
                bar: 123456,
                sector: 0,
            },
        };
        // Act
        await createZone(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
        expect(responseJson.errors).toBeDefined();
    });
    it("should return 400 for missing required fields", async () => {
        // Arrange
        mockRequest = {
            body: {
                title: "42-5-2",
                // missing bar
            },
        };
        // Act
        await createZone(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
        expect(responseJson.errors).toBeDefined();
    });
    it("should return 400 for negative bar value", async () => {
        // Arrange
        mockRequest = {
            body: {
                title: "42-5-2",
                bar: -1,
                sector: 0,
            },
        };
        // Act
        await createZone(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
        expect(responseJson.errors).toBeDefined();
    });
    it("should return 400 for negative sector value", async () => {
        // Arrange
        mockRequest = {
            body: {
                title: "42-5-2",
                bar: 420502,
                sector: -1,
            },
        };
        // Act
        await createZone(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
        expect(responseJson.errors).toBeDefined();
    });
    it("should return 409 for duplicate title", async () => {
        // Arrange
        const existingZone = await createTestZone({
            title: "42-5-2",
            bar: 420502,
            sector: 0,
        });
        mockRequest = {
            body: {
                title: "42-5-2", // same title
                bar: 999999, // different bar
                sector: 1, // different sector
            },
        };
        // Act
        await createZone(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(409);
        expect(responseJson.message).toBe("Zone with this data already exists");
        expect(responseJson.duplicateFields).toContain("title");
    });
    it("should return 409 for duplicate bar", async () => {
        // Arrange
        const existingZone = await createTestZone({
            title: "42-5-2",
            bar: 420502,
            sector: 0,
        });
        mockRequest = {
            body: {
                title: "99-9-9", // different title
                bar: 420502, // same bar
                sector: 1, // different sector
            },
        };
        // Act
        await createZone(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(409);
        expect(responseJson.message).toBe("Zone with this data already exists");
        expect(responseJson.duplicateFields).toContain("bar");
    });
    it("should allow duplicate sector values", async () => {
        // Arrange
        const existingZone = await createTestZone({
            title: "42-5-2",
            bar: 420502,
            sector: 0,
        });
        mockRequest = {
            body: {
                title: "99-9-9", // different title
                bar: 999999, // different bar
                sector: 0, // same sector - should be allowed
            },
        };
        // Act
        await createZone(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(201);
        expect(responseJson.data.sector).toBe(0);
    });
    it("should create zone with valid title patterns", async () => {
        const validTitles = ["42-1", "22-5-1", "42-13-2", "1", "99-99-99"];
        for (let i = 0; i < validTitles.length; i++) {
            const title = validTitles[i];
            // Arrange
            mockRequest = {
                body: {
                    title,
                    bar: Math.floor(Math.random() * 1000000) + i * 1000, // Уникальный bar
                    sector: i + 1, // Уникальный sector
                },
            };
            // Act
            await createZone(mockRequest, res);
            // Assert
            expect(responseStatus.code).toBe(201);
            expect(responseJson.data.title).toBe(title);
        }
    });
    it("should reject invalid title patterns", async () => {
        const invalidTitles = [
            "42-", // incomplete
            "-42", // starts with dash
            "42--5", // double dash
            "42-5-", // incomplete last segment
            "abc-5", // non-numeric
            "42-5-abc", // non-numeric last segment
            "42-5-2-3", // too many segments
            "", // empty
        ];
        for (const title of invalidTitles) {
            // Arrange
            mockRequest = {
                body: {
                    title,
                    bar: Math.floor(Math.random() * 1000000),
                    sector: 0,
                },
            };
            // Act
            await createZone(mockRequest, res);
            // Assert
            expect(responseStatus.code).toBe(400);
            expect(responseJson.message).toBe("Validation error");
        }
    });
    it("should handle database error gracefully", async () => {
        // Arrange
        mockRequest = {
            body: {
                title: "42-5-2",
                bar: 420502,
                sector: 0,
            },
        };
        // Mock Zone.save() to throw an error
        const originalSave = mongoose.Model.prototype.save;
        mongoose.Model.prototype.save = vi
            .fn()
            .mockRejectedValue(new Error("Database connection failed"));
        // Act
        await createZone(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
        // Restore original save method
        mongoose.Model.prototype.save = originalSave;
    });
});
