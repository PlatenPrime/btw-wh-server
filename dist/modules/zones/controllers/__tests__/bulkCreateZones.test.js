import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestZone } from "../../../../test/setup.js";
import { upsertZones } from "../bulkCreateZones.js";
describe("upsertZones Controller", () => {
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
    it("should create multiple zones successfully", async () => {
        // Arrange
        mockRequest = {
            body: {
                zones: [
                    { title: "42-1", bar: 4201 },
                    { title: "42-2", bar: 4202 },
                    { title: "42-3", bar: 4203 },
                ],
            },
        };
        // Act
        await upsertZones(mockRequest, res, mockNext);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Upsert completed");
        expect(responseJson.result).toBeDefined();
        expect(responseJson.result.upsertedCount).toBe(3);
        expect(responseJson.result.modifiedCount).toBe(0);
    });
    it("should update existing zones with same bar", async () => {
        // Arrange
        await createTestZone({ title: "42-1", bar: 4201, sector: 0 });
        mockRequest = {
            body: {
                zones: [
                    { title: "42-2", bar: 4201 }, // same bar, different title
                    { title: "42-3", bar: 4203 }, // new zone
                ],
            },
        };
        // Act
        await upsertZones(mockRequest, res, mockNext);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Upsert completed");
        expect(responseJson.result.upsertedCount).toBe(1);
        expect(responseJson.result.modifiedCount).toBe(1);
    });
    it("should handle mixed create and update operations", async () => {
        // Arrange
        await createTestZone({ title: "42-1", bar: 4201, sector: 0 });
        mockRequest = {
            body: {
                zones: [
                    { title: "42-2", bar: 4201 }, // update existing
                    { title: "42-3", bar: 4203 }, // create new
                ],
            },
        };
        // Act
        await upsertZones(mockRequest, res, mockNext);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Upsert completed");
        expect(responseJson.result.upsertedCount).toBe(1);
        expect(responseJson.result.modifiedCount).toBe(1);
    });
    it("should return 400 for empty zones array", async () => {
        // Arrange
        mockRequest = {
            body: {
                zones: [],
            },
        };
        // Act
        await upsertZones(mockRequest, res, mockNext);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
        expect(responseJson.errors).toBeDefined();
    });
    it("should return 400 for missing zones field", async () => {
        // Arrange
        mockRequest = {
            body: {},
        };
        // Act
        await upsertZones(mockRequest, res, mockNext);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
        expect(responseJson.errors).toBeDefined();
    });
    it("should handle large batch of zones", async () => {
        // Arrange
        const zones = Array.from({ length: 100 }, (_, i) => ({
            title: `42-${i}`,
            bar: 4200 + i,
        }));
        mockRequest = {
            body: { zones },
        };
        // Act
        await upsertZones(mockRequest, res, mockNext);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Upsert completed");
        expect(responseJson.result.upsertedCount).toBe(100);
    });
    it("should return 400 for invalid zone data", async () => {
        // Arrange
        mockRequest = {
            body: {
                zones: [
                    { title: "invalid-title", bar: 4201 }, // invalid title
                    { title: "42-2", bar: -1 }, // invalid bar
                ],
            },
        };
        // Act
        await upsertZones(mockRequest, res, mockNext);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
        expect(responseJson.errors).toBeDefined();
    });
    it("should handle zones with optional sector field", async () => {
        // Arrange
        mockRequest = {
            body: {
                zones: [
                    { title: "42-1", bar: 4201, sector: 5 }, // with sector
                    { title: "42-2", bar: 4202 }, // without sector (defaults to 0)
                ],
            },
        };
        // Act
        await upsertZones(mockRequest, res, mockNext);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Upsert completed");
        expect(responseJson.result.upsertedCount).toBe(2);
    });
    it("should set sector to 0 when not provided", async () => {
        // Arrange
        mockRequest = {
            body: {
                zones: [
                    { title: "42-1", bar: 4201 },
                    { title: "42-2", bar: 4202 },
                ],
            },
        };
        // Act
        await upsertZones(mockRequest, res, mockNext);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.result.upsertedCount).toBe(2);
        // Verify zones were created with sector = 0
        const Zone = require("mongoose").model("Zone");
        const createdZones = await Zone.find({ title: { $in: ["42-1", "42-2"] } });
        expect(createdZones).toHaveLength(2);
        createdZones.forEach((zone) => {
            expect(zone.sector).toBe(0);
        });
    });
    it("should handle zones with different title formats", async () => {
        // Arrange
        mockRequest = {
            body: {
                zones: [
                    { title: "42-1", bar: 4201 },
                    { title: "22-5-1", bar: 22501 },
                    { title: "42-13-2", bar: 421302 },
                    { title: "1", bar: 1 },
                ],
            },
        };
        // Act
        await upsertZones(mockRequest, res, mockNext);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Upsert completed");
        expect(responseJson.result.upsertedCount).toBe(4);
    });
    it("should handle single zone upsert", async () => {
        // Arrange
        mockRequest = {
            body: {
                zones: [{ title: "42-1", bar: 4201 }],
            },
        };
        // Act
        await upsertZones(mockRequest, res, mockNext);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Upsert completed");
        expect(responseJson.result.upsertedCount).toBe(1);
    });
    it("should handle duplicate bars in same batch", async () => {
        // Arrange
        mockRequest = {
            body: {
                zones: [
                    { title: "42-1", bar: 4201 },
                    { title: "42-2", bar: 4201 }, // same bar
                ],
            },
        };
        // Act
        await upsertZones(mockRequest, res, mockNext);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Upsert completed");
        expect(responseJson.result.upsertedCount).toBe(1);
        expect(responseJson.result.modifiedCount).toBe(1);
    });
    it("should handle zones with custom sector values", async () => {
        // Arrange
        mockRequest = {
            body: {
                zones: [
                    { title: "42-1", bar: 4201, sector: 10 },
                    { title: "42-2", bar: 4202, sector: 20 },
                ],
            },
        };
        // Act
        await upsertZones(mockRequest, res, mockNext);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Upsert completed");
        expect(responseJson.result.upsertedCount).toBe(2);
        // Verify zones were created with custom sectors
        const Zone = require("mongoose").model("Zone");
        const createdZones = await Zone.find({ title: { $in: ["42-1", "42-2"] } });
        expect(createdZones).toHaveLength(2);
        const zone1 = createdZones.find((z) => z.title === "42-1");
        const zone2 = createdZones.find((z) => z.title === "42-2");
        expect(zone1.sector).toBe(10);
        expect(zone2.sector).toBe(20);
    });
});
