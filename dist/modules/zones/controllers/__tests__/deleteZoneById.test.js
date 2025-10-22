import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestZone } from "../../../../test/setup.js";
import { deleteZoneById } from "../deleteZoneById.js";
describe("deleteZoneById Controller", () => {
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
    it("should delete zone by valid ObjectId", async () => {
        // Arrange
        const testZone = await createTestZone({
            title: "42-5-2",
            bar: 420502,
            sector: 0,
        });
        mockRequest = {
            params: { id: testZone._id.toString() },
        };
        // Act
        await deleteZoneById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Zone deleted successfully");
        expect(responseJson.data.title).toBe("42-5-2");
        expect(responseJson.data.bar).toBe(420502);
        expect(responseJson.data.sector).toBe(0);
        expect(responseJson.data._id.toString()).toBe(testZone._id.toString());
    });
    it("should return 404 when zone not found", async () => {
        // Arrange
        const nonExistentId = new mongoose.Types.ObjectId();
        mockRequest = {
            params: { id: nonExistentId.toString() },
        };
        // Act
        await deleteZoneById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Zone not found");
    });
    it("should return 400 for invalid ObjectId format", async () => {
        // Arrange
        mockRequest = {
            params: { id: "invalid-id-format" },
        };
        // Act
        await deleteZoneById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Invalid zone ID format");
    });
    it("should return 400 for empty id parameter", async () => {
        // Arrange
        mockRequest = {
            params: { id: "" },
        };
        // Act
        await deleteZoneById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Invalid zone ID format");
    });
    it("should return 400 for undefined id parameter", async () => {
        // Arrange
        mockRequest = {
            params: {},
        };
        // Act
        await deleteZoneById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Invalid zone ID format");
    });
    it("should delete zone with all fields populated", async () => {
        // Arrange
        const testZone = await createTestZone({
            title: "42-5-2",
            bar: 420502,
            sector: 1,
        });
        mockRequest = {
            params: { id: testZone._id.toString() },
        };
        // Act
        await deleteZoneById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.title).toBe("42-5-2");
        expect(responseJson.data.bar).toBe(420502);
        expect(responseJson.data.sector).toBe(1);
        expect(responseJson.data.createdAt).toBeDefined();
        expect(responseJson.data.updatedAt).toBeDefined();
    });
    it("should delete zone with different sector values", async () => {
        // Arrange
        const testZone = await createTestZone({
            title: "42-5-2",
            bar: 420502,
            sector: 999,
        });
        mockRequest = {
            params: { id: testZone._id.toString() },
        };
        // Act
        await deleteZoneById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.sector).toBe(999);
    });
    it("should handle very long ObjectId", async () => {
        // Arrange
        const longId = "507f1f77bcf86cd799439011"; // Valid 24-character ObjectId
        mockRequest = {
            params: { id: longId },
        };
        // Act
        await deleteZoneById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Zone not found");
    });
    it("should handle ObjectId with special characters", async () => {
        // Arrange
        mockRequest = {
            params: { id: "507f1f77bcf86cd79943901!" }, // Invalid character
        };
        // Act
        await deleteZoneById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Invalid zone ID format");
    });
    it("should return deleted zone data", async () => {
        // Arrange
        const testZone = await createTestZone({
            title: "42-5-2",
            bar: 420502,
            sector: 0,
        });
        mockRequest = {
            params: { id: testZone._id.toString() },
        };
        // Act
        await deleteZoneById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data).toBeDefined();
        expect(responseJson.data._id).toBeDefined();
        expect(responseJson.data.title).toBe("42-5-2");
        expect(responseJson.data.bar).toBe(420502);
        expect(responseJson.data.sector).toBe(0);
    });
    it("should verify zone is actually deleted from database", async () => {
        // Arrange
        const testZone = await createTestZone({
            title: "42-5-2",
            bar: 420502,
            sector: 0,
        });
        mockRequest = {
            params: { id: testZone._id.toString() },
        };
        // Act
        await deleteZoneById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        // Verify zone is deleted by trying to find it
        const Zone = mongoose.model("Zone");
        const deletedZone = await Zone.findById(testZone._id);
        expect(deletedZone).toBeNull();
    });
    it("should handle deletion of zone with minimal required fields", async () => {
        // Arrange
        const testZone = await createTestZone({
            title: "42-1",
            bar: 4201,
            sector: 0,
        });
        mockRequest = {
            params: { id: testZone._id.toString() },
        };
        // Act
        await deleteZoneById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.title).toBe("42-1");
        expect(responseJson.data.bar).toBe(4201);
        expect(responseJson.data.sector).toBe(0);
    });
});
