import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestZone } from "../../../../test/setup.js";
import { updateZoneById } from "../update-zone-by-id/updateZoneById.js";
describe("updateZoneById Controller", () => {
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
    });
    it("should update zone with valid data", async () => {
        // Arrange
        const testZone = await createTestZone({
            title: "42-5-2",
            bar: 420502,
            sector: 0,
        });
        mockRequest = {
            params: { id: testZone._id.toString() },
            body: {
                title: "42-5-3",
                bar: 420503,
                sector: 1,
            },
        };
        // Act
        await updateZoneById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Zone updated successfully");
        expect(responseJson.data.title).toBe("42-5-3");
        expect(responseJson.data.bar).toBe(420503);
        expect(responseJson.data.sector).toBe(1);
        expect(responseJson.data._id.toString()).toBe(testZone._id.toString());
    });
    it("should update zone with partial data", async () => {
        // Arrange
        const testZone = await createTestZone({
            title: "42-5-2",
            bar: 420502,
            sector: 0,
        });
        mockRequest = {
            params: { id: testZone._id.toString() },
            body: {
                title: "42-5-3", // only update title
            },
        };
        // Act
        await updateZoneById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.title).toBe("42-5-3");
        expect(responseJson.data.bar).toBe(420502); // unchanged
        expect(responseJson.data.sector).toBe(0); // unchanged
    });
    it("should return 404 when zone not found", async () => {
        // Arrange
        const nonExistentId = new mongoose.Types.ObjectId();
        mockRequest = {
            params: { id: nonExistentId.toString() },
            body: {
                title: "42-5-3",
            },
        };
        // Act
        await updateZoneById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Zone not found");
    });
    it("should return 400 for invalid ObjectId format", async () => {
        // Arrange
        mockRequest = {
            params: { id: "invalid-id-format" },
            body: {
                title: "42-5-3",
            },
        };
        // Act
        await updateZoneById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Invalid zone ID format");
    });
    it("should return 400 for empty body", async () => {
        // Arrange
        const testZone = await createTestZone({
            title: "42-5-2",
            bar: 420502,
            sector: 0,
        });
        mockRequest = {
            params: { id: testZone._id.toString() },
            body: {}, // empty body
        };
        // Act
        await updateZoneById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
        expect(responseJson.errors).toBeDefined();
    });
    it("should return 400 for invalid title format", async () => {
        // Arrange
        const testZone = await createTestZone({
            title: "42-5-2",
            bar: 420502,
            sector: 0,
        });
        mockRequest = {
            params: { id: testZone._id.toString() },
            body: {
                title: "invalid-title-format",
            },
        };
        // Act
        await updateZoneById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
        expect(responseJson.errors).toBeDefined();
    });
    it("should return 400 for negative bar value", async () => {
        // Arrange
        const testZone = await createTestZone({
            title: "42-5-2",
            bar: 420502,
            sector: 0,
        });
        mockRequest = {
            params: { id: testZone._id.toString() },
            body: {
                bar: -1,
            },
        };
        // Act
        await updateZoneById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
        expect(responseJson.errors).toBeDefined();
    });
    it("should return 400 for negative sector value", async () => {
        // Arrange
        const testZone = await createTestZone({
            title: "42-5-2",
            bar: 420502,
            sector: 0,
        });
        mockRequest = {
            params: { id: testZone._id.toString() },
            body: {
                sector: -1,
            },
        };
        // Act
        await updateZoneById(mockRequest, res);
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
        const testZone = await createTestZone({
            title: "43-5-2",
            bar: 430502,
            sector: 1,
        });
        mockRequest = {
            params: { id: testZone._id.toString() },
            body: {
                title: "42-5-2", // duplicate title
            },
        };
        // Act
        await updateZoneById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(409);
        expect(responseJson.message).toBe("Zone with this data already exists");
        expect(responseJson.duplicateFields).toContain("title");
    });
    it("should return 409 for duplicate bar", async () => {
        // Arrange
        const existingZone = await createTestZone({
            title: "42-5-3",
            bar: 420503,
            sector: 0,
        });
        const testZone = await createTestZone({
            title: "43-5-3",
            bar: 430503,
            sector: 1,
        });
        mockRequest = {
            params: { id: testZone._id.toString() },
            body: {
                bar: 420503, // duplicate bar
            },
        };
        // Act
        await updateZoneById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(409);
        expect(responseJson.message).toBe("Zone with this data already exists");
        expect(responseJson.duplicateFields).toContain("bar");
    });
    it("should allow duplicate sector values", async () => {
        // Arrange
        const testZone = await createTestZone({
            title: "42-5-7",
            bar: 420507,
            sector: 1,
        });
        mockRequest = {
            params: { id: testZone._id.toString() },
            body: {
                sector: 0, // should be allowed to have same sector as other zones
            },
        };
        // Act
        await updateZoneById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.sector).toBe(0);
    });
    it("should allow updating to same values", async () => {
        // Arrange
        const testZone = await createTestZone({
            title: "42-5-2",
            bar: 420502,
            sector: 0,
        });
        mockRequest = {
            params: { id: testZone._id.toString() },
            body: {
                title: "42-5-2", // same title
                bar: 420502, // same bar
                sector: 0, // same sector
            },
        };
        // Act
        await updateZoneById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.title).toBe("42-5-2");
        expect(responseJson.data.bar).toBe(420502);
        expect(responseJson.data.sector).toBe(0);
    });
    it("should update only provided fields", async () => {
        // Arrange
        const testZone = await createTestZone({
            title: "42-5-2",
            bar: 420502,
            sector: 0,
        });
        mockRequest = {
            params: { id: testZone._id.toString() },
            body: {
                bar: 999999, // only update bar
            },
        };
        // Act
        await updateZoneById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.title).toBe("42-5-2"); // unchanged
        expect(responseJson.data.bar).toBe(999999); // updated
        expect(responseJson.data.sector).toBe(0); // unchanged
    });
    it("should return updated timestamps", async () => {
        // Arrange
        const testZone = await createTestZone({
            title: "42-5-2",
            bar: 420502,
            sector: 0,
        });
        const originalUpdatedAt = testZone.updatedAt;
        mockRequest = {
            params: { id: testZone._id.toString() },
            body: {
                title: "42-5-3",
            },
        };
        // Act
        await updateZoneById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.updatedAt).toBeDefined();
        expect(new Date(responseJson.data.updatedAt)).toBeInstanceOf(Date);
        expect(new Date(responseJson.data.updatedAt).getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
});
