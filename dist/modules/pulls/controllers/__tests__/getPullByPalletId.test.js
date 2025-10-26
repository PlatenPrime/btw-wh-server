import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPullByPalletId } from "../getPullByPalletId.js";
// Mock the calculatePullByPalletId utility
vi.mock("../../utils/calculatePulls.js", () => ({
    calculatePullByPalletId: vi.fn(),
}));
describe("getPullByPalletId Controller", () => {
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
    it("should return pull for valid pallet ID", async () => {
        // Arrange
        const palletId = new mongoose.Types.ObjectId().toString();
        const mockPull = {
            palletId: new mongoose.Types.ObjectId(palletId),
            palletTitle: "Test Pallet",
            sector: 1,
            rowTitle: "Test Row",
            positions: [
                {
                    posId: new mongoose.Types.ObjectId(),
                    artikul: "ART001",
                    nameukr: "Test Product",
                    currentQuant: 10,
                    requestedQuant: 5,
                    askId: new mongoose.Types.ObjectId(),
                    askerData: {
                        _id: new mongoose.Types.ObjectId(),
                        fullname: "Test User",
                        telegram: "@testuser",
                        photo: "test-photo.jpg",
                    },
                },
            ],
            totalAsks: 1,
        };
        const { calculatePullByPalletId } = await import("../../utils/calculatePulls.js");
        vi.mocked(calculatePullByPalletId).mockResolvedValue(mockPull);
        mockRequest = {
            params: { palletId },
        };
        // Act
        await getPullByPalletId(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.success).toBe(true);
        expect(responseJson.message).toBe("Pull retrieved successfully");
        expect(responseJson.data).toEqual(mockPull);
        expect(calculatePullByPalletId).toHaveBeenCalledWith(new mongoose.Types.ObjectId(palletId));
    });
    it("should return 404 when pull not found", async () => {
        // Arrange
        const palletId = new mongoose.Types.ObjectId().toString();
        const { calculatePullByPalletId } = await import("../../utils/calculatePulls.js");
        vi.mocked(calculatePullByPalletId).mockResolvedValue(null);
        mockRequest = {
            params: { palletId },
        };
        // Act
        await getPullByPalletId(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(404);
        expect(responseJson.success).toBe(false);
        expect(responseJson.message).toBe("Pull not found for the specified pallet");
        expect(responseJson.data).toBeNull();
    });
    it("should return 400 for invalid pallet ID format", async () => {
        // Arrange
        const invalidPalletId = "invalid-id-format";
        mockRequest = {
            params: { palletId: invalidPalletId },
        };
        // Act
        await getPullByPalletId(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.success).toBe(false);
        expect(responseJson.message).toBe("Invalid pallet ID format");
    });
    it("should handle calculation errors", async () => {
        // Arrange
        const palletId = new mongoose.Types.ObjectId().toString();
        const { calculatePullByPalletId } = await import("../../utils/calculatePulls.js");
        vi.mocked(calculatePullByPalletId).mockRejectedValue(new Error("Database error"));
        mockRequest = {
            params: { palletId },
        };
        // Act
        await getPullByPalletId(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.success).toBe(false);
        expect(responseJson.message).toBe("Failed to calculate pull for pallet");
        expect(responseJson.error).toBe("Database error");
    });
    it("should handle unknown errors", async () => {
        // Arrange
        const palletId = new mongoose.Types.ObjectId().toString();
        const { calculatePullByPalletId } = await import("../../utils/calculatePulls.js");
        vi.mocked(calculatePullByPalletId).mockRejectedValue("Unknown error");
        mockRequest = {
            params: { palletId },
        };
        // Act
        await getPullByPalletId(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.success).toBe(false);
        expect(responseJson.message).toBe("Failed to calculate pull for pallet");
        expect(responseJson.error).toBe("Unknown error");
    });
});
