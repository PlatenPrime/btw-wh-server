import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestAsk } from "../../../../test/setup.js";
import { getAskById } from "../getAskById.js";
describe("getAskById Controller", () => {
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
    it("should return ask by valid ObjectId", async () => {
        // Arrange
        const testAsk = await createTestAsk({
            artikul: "TEST123",
            nameukr: "Test Ask",
            quant: 15,
            com: "Test comment for ask",
            status: "new",
        });
        mockRequest = {
            params: { id: testAsk._id.toString() },
        };
        // Act
        await getAskById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Ask retrieved successfully");
        expect(responseJson.data.artikul).toBe("TEST123");
        expect(responseJson.data.nameukr).toBe("Test Ask");
        expect(responseJson.data.quant).toBe(15);
        expect(responseJson.data.com).toBe("Test comment for ask");
        expect(responseJson.data.status).toBe("new");
        expect(responseJson.data._id).toBeDefined();
    });
    it("should return 200 with exists false when ask not found", async () => {
        // Arrange
        const nonExistentId = new mongoose.Types.ObjectId();
        mockRequest = {
            params: { id: nonExistentId.toString() },
        };
        // Act
        await getAskById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(false);
        expect(responseJson.message).toBe("Ask not found");
        expect(responseJson.data).toBe(null);
    });
    it("should return 500 for invalid ObjectId format", async () => {
        // Arrange
        mockRequest = {
            params: { id: "invalid-id-format" },
        };
        // Act
        await getAskById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error while fetching ask");
        expect(responseJson.error).toBeDefined();
    });
    it("should return ask with all fields populated", async () => {
        // Arrange
        const testAsk = await createTestAsk({
            artikul: "FULL123",
            nameukr: "Full Test Ask",
            quant: 25,
            com: "Detailed comment",
            status: "new",
            actions: ["action1", "action2"],
        });
        mockRequest = {
            params: { id: testAsk._id.toString() },
        };
        // Act
        await getAskById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Ask retrieved successfully");
        expect(responseJson.data.artikul).toBe("FULL123");
        expect(responseJson.data.nameukr).toBe("Full Test Ask");
        expect(responseJson.data.quant).toBe(25);
        expect(responseJson.data.com).toBe("Detailed comment");
        expect(responseJson.data.status).toBe("new");
        expect(responseJson.data.actions).toEqual(["action1", "action2"]);
        expect(responseJson.data.askerData).toBeDefined();
        expect(responseJson.data.askerData.fullname).toBe("Test User");
    });
    it("should return ask with different statuses", async () => {
        // Arrange
        const testAsk = await createTestAsk({
            artikul: "STATUS123",
            status: "completed",
        });
        mockRequest = {
            params: { id: testAsk._id.toString() },
        };
        // Act
        await getAskById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Ask retrieved successfully");
        expect(responseJson.data.status).toBe("completed");
    });
    it("should handle empty id parameter", async () => {
        // Arrange
        mockRequest = {
            params: { id: "" },
        };
        // Act
        await getAskById(mockRequest, res);
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
        await getAskById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("ID is required");
    });
    it("should return timestamps", async () => {
        // Arrange
        const testAsk = await createTestAsk({
            artikul: "TIMESTAMP_TEST",
        });
        mockRequest = {
            params: { id: testAsk._id.toString() },
        };
        // Act
        await getAskById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Ask retrieved successfully");
        expect(responseJson.data.createdAt).toBeDefined();
        expect(responseJson.data.updatedAt).toBeDefined();
        expect(new Date(responseJson.data.createdAt)).toBeInstanceOf(Date);
        expect(new Date(responseJson.data.updatedAt)).toBeInstanceOf(Date);
    });
    it("should handle ask with minimal required fields", async () => {
        // Arrange
        const testAsk = await createTestAsk({
            artikul: "MINIMAL",
            // Only required fields
        });
        mockRequest = {
            params: { id: testAsk._id.toString() },
        };
        // Act
        await getAskById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Ask retrieved successfully");
        expect(responseJson.data.artikul).toBe("MINIMAL");
        expect(responseJson.data._id).toBeDefined();
        expect(responseJson.data.askerData).toBeDefined();
        expect(responseJson.data.status).toBe("new"); // Default value
    });
    it("should handle ask with solver data", async () => {
        // Arrange
        const testAsk = await createTestAsk({
            artikul: "SOLVER123",
            solverData: {
                _id: new mongoose.Types.ObjectId(),
                fullname: "Solver User",
                telegram: "@solver",
                photo: "photo.jpg",
            },
        });
        mockRequest = {
            params: { id: testAsk._id.toString() },
        };
        // Act
        await getAskById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Ask retrieved successfully");
        expect(responseJson.data.solverData).toBeDefined();
        expect(responseJson.data.solverData.fullname).toBe("Solver User");
        expect(responseJson.data.solverData.telegram).toBe("@solver");
        expect(responseJson.data.solverData.photo).toBe("photo.jpg");
    });
    it("should handle very long ObjectId", async () => {
        // Arrange
        const longId = "507f1f77bcf86cd799439011"; // Valid 24-character ObjectId
        mockRequest = {
            params: { id: longId },
        };
        // Act
        await getAskById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(false);
        expect(responseJson.message).toBe("Ask not found");
        expect(responseJson.data).toBe(null);
    });
    it("should handle ask with rejected status", async () => {
        // Arrange
        const testAsk = await createTestAsk({
            artikul: "REJECTED123",
            status: "rejected",
        });
        mockRequest = {
            params: { id: testAsk._id.toString() },
        };
        // Act
        await getAskById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Ask retrieved successfully");
        expect(responseJson.data.status).toBe("rejected");
    });
    it("should handle ask with empty actions array", async () => {
        // Arrange
        const testAsk = await createTestAsk({
            artikul: "EMPTY_ACTIONS",
            actions: [],
        });
        mockRequest = {
            params: { id: testAsk._id.toString() },
        };
        // Act
        await getAskById(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.message).toBe("Ask retrieved successfully");
        expect(responseJson.data.actions).toEqual([]);
    });
});
