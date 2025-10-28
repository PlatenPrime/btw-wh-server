import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestAsk, createTestPos, createTestUser, } from "../../../../test/setup.js";
import { Ask } from "../../../asks/models/Ask.js";
import User from "../../../auth/models/User.js";
import { Pallet } from "../../../pallets/models/Pallet.js";
import { Pos } from "../../../poses/models/Pos.js";
import { processPullPosition } from "../process-pull-position/processPullPosition.js";
// Mock external dependencies
vi.mock("../../../../utils/getCurrentFormattedDateTime.js", () => ({
    getCurrentFormattedDateTime: vi.fn(() => "15.01.2024 10:30"),
}));
vi.mock("../../../../utils/telegram/sendMessageToTGUser.js", () => ({
    sendMessageToTGUser: vi.fn(),
}));
describe("processPullPosition Controller", () => {
    let mockRequest;
    let responseJson;
    let responseStatus;
    let res;
    let testUser;
    let solverUser;
    let testAsk;
    let testPosition;
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
        // Create test users
        testUser = await createTestUser({
            username: "askeruser",
            fullname: "Asker User",
            telegram: "@askeruser",
            photo: "asker-photo.jpg",
        });
        solverUser = await createTestUser({
            username: "solveruser",
            fullname: "Solver User",
            telegram: "@solveruser",
            photo: "solver-photo.jpg",
        });
        // Create test ask
        testAsk = await createTestAsk({
            artikul: "TEST123",
            nameukr: "Test Product",
            quant: 10,
            asker: testUser._id,
            askerData: {
                _id: testUser._id,
                fullname: testUser.fullname,
                telegram: testUser.telegram,
                photo: testUser.photo,
            },
            status: "new",
            actions: ["15.01.2024 10:00 Asker User: створено запит"],
        });
        // Create test position
        testPosition = await createTestPos({
            artikul: "TEST123",
            nameukr: "Test Product",
            quant: 15,
            palletTitle: "Test Pallet",
            rowTitle: "Test Row",
            palletData: {
                _id: "pallet1",
                title: "Test Pallet",
                sector: "1",
                isDef: false,
            },
            rowData: {
                _id: "row1",
                title: "Test Row",
            },
            pallet: "pallet1",
            row: "row1",
        });
        vi.clearAllMocks();
    });
    it("should process position successfully with partial quantity", async () => {
        // Arrange
        const palletId = "pallet1";
        const posId = testPosition._id.toString();
        const actualQuant = 5;
        mockRequest = {
            params: { palletId, posId },
            body: {
                actualQuant,
                solverId: solverUser._id.toString(),
            },
        };
        // Mock database operations
        vi.mocked(Pos.findById).mockResolvedValue(testPosition);
        vi.mocked(User.findById).mockResolvedValue(solverUser);
        vi.mocked(Ask.find).mockResolvedValue([testAsk]);
        vi.mocked(Pos.findByIdAndUpdate).mockResolvedValue({
            ...testPosition,
            quant: testPosition.quant - actualQuant,
        });
        vi.mocked(Ask.findByIdAndUpdate).mockResolvedValue({
            ...testAsk,
            actions: [
                ...testAsk.actions,
                "15.01.2024 10:30 Solver User: знято 5 шт. з паллети Test Pallet",
            ],
        });
        // Act
        await processPullPosition(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.success).toBe(true);
        expect(responseJson.message).toBe("Position processed successfully");
        expect(responseJson.data.actualQuant).toBe(actualQuant);
        expect(responseJson.data.remainingQuant).toBe(10); // 15 - 5
        expect(responseJson.data.askCompleted).toBe(false); // 10 - 5 = 5 remaining
    });
    it("should process position and complete ask when quantity is fully satisfied", async () => {
        // Arrange
        const palletId = "pallet1";
        const posId = testPosition._id.toString();
        const actualQuant = 10; // Full quantity requested
        mockRequest = {
            params: { palletId, posId },
            body: {
                actualQuant,
                solverId: solverUser._id.toString(),
            },
        };
        // Mock database operations
        vi.mocked(Pos.findById).mockResolvedValue(testPosition);
        vi.mocked(User.findById).mockResolvedValue(solverUser);
        vi.mocked(Ask.find).mockResolvedValue([testAsk]);
        vi.mocked(Pos.findByIdAndUpdate).mockResolvedValue({
            ...testPosition,
            quant: testPosition.quant - actualQuant,
        });
        vi.mocked(Ask.findByIdAndUpdate).mockResolvedValue({
            ...testAsk,
            status: "completed",
            solver: solverUser._id,
            solverData: {
                _id: solverUser._id,
                fullname: solverUser.fullname,
                telegram: solverUser.telegram,
                photo: solverUser.photo,
            },
            actions: [
                ...testAsk.actions,
                "15.01.2024 10:30 Solver User: знято 10 шт. з паллети Test Pallet",
                "15.01.2024 10:30 Solver User: ВИКОНАВ запит",
            ],
        });
        // Act
        await processPullPosition(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.success).toBe(true);
        expect(responseJson.data.askCompleted).toBe(true);
        expect(responseJson.data.remainingQuant).toBe(5); // 15 - 10
    });
    it("should remove position when quantity becomes 0", async () => {
        // Arrange
        const palletId = "pallet1";
        const posId = testPosition._id.toString();
        const actualQuant = 15; // All available quantity
        mockRequest = {
            params: { palletId, posId },
            body: {
                actualQuant,
                solverId: solverUser._id.toString(),
            },
        };
        // Mock database operations
        vi.mocked(Pos.findById).mockResolvedValue(testPosition);
        vi.mocked(User.findById).mockResolvedValue(solverUser);
        vi.mocked(Ask.find).mockResolvedValue([testAsk]);
        vi.mocked(Pos.findByIdAndDelete).mockResolvedValue(testPosition);
        vi.mocked(Pallet.findByIdAndUpdate).mockResolvedValue({});
        vi.mocked(Ask.findByIdAndUpdate).mockResolvedValue({
            ...testAsk,
            actions: [
                ...testAsk.actions,
                "15.01.2024 10:30 Solver User: знято 15 шт. з паллети Test Pallet",
            ],
        });
        // Act
        await processPullPosition(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.success).toBe(true);
        expect(responseJson.data.remainingQuant).toBe(0);
        expect(Pos.findByIdAndDelete).toHaveBeenCalledWith(posId, expect.any(Object));
        expect(Pallet.findByIdAndUpdate).toHaveBeenCalledWith(palletId, { $pull: { poses: posId } }, expect.any(Object));
    });
    it("should return 400 for invalid pallet ID format", async () => {
        // Arrange
        mockRequest = {
            params: { palletId: "invalid-id", posId: testPosition._id.toString() },
            body: {
                actualQuant: 5,
                solverId: solverUser._id.toString(),
            },
        };
        // Act
        await processPullPosition(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.success).toBe(false);
        expect(responseJson.message).toBe("Invalid pallet ID or position ID format");
    });
    it("should return 400 for invalid position ID format", async () => {
        // Arrange
        mockRequest = {
            params: { palletId: "pallet1", posId: "invalid-id" },
            body: {
                actualQuant: 5,
                solverId: solverUser._id.toString(),
            },
        };
        // Act
        await processPullPosition(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.success).toBe(false);
        expect(responseJson.message).toBe("Invalid pallet ID or position ID format");
    });
    it("should return 400 for invalid request body", async () => {
        // Arrange
        mockRequest = {
            params: { palletId: "pallet1", posId: testPosition._id.toString() },
            body: {
                actualQuant: -5, // Invalid negative quantity
                solverId: solverUser._id.toString(),
            },
        };
        // Act
        await processPullPosition(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.success).toBe(false);
        expect(responseJson.message).toBe("Invalid request data");
        expect(responseJson.errors).toBeDefined();
    });
    it("should return 404 when position not found", async () => {
        // Arrange
        const palletId = "pallet1";
        const posId = new mongoose.Types.ObjectId().toString();
        mockRequest = {
            params: { palletId, posId },
            body: {
                actualQuant: 5,
                solverId: solverUser._id.toString(),
            },
        };
        vi.mocked(Pos.findById).mockResolvedValue(null);
        // Act
        await processPullPosition(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(404);
        expect(responseJson.success).toBe(false);
        expect(responseJson.message).toBe("Position not found");
    });
    it("should return 404 when solver user not found", async () => {
        // Arrange
        const palletId = "pallet1";
        const posId = testPosition._id.toString();
        mockRequest = {
            params: { palletId, posId },
            body: {
                actualQuant: 5,
                solverId: new mongoose.Types.ObjectId().toString(),
            },
        };
        vi.mocked(Pos.findById).mockResolvedValue(testPosition);
        vi.mocked(User.findById).mockResolvedValue(null);
        // Act
        await processPullPosition(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(404);
        expect(responseJson.success).toBe(false);
        expect(responseJson.message).toBe("Solver user not found");
    });
    it("should return 400 when actual quantity exceeds available quantity", async () => {
        // Arrange
        const palletId = "pallet1";
        const posId = testPosition._id.toString();
        const actualQuant = 20; // More than available (15)
        mockRequest = {
            params: { palletId, posId },
            body: {
                actualQuant,
                solverId: solverUser._id.toString(),
            },
        };
        vi.mocked(Pos.findById).mockResolvedValue(testPosition);
        vi.mocked(User.findById).mockResolvedValue(solverUser);
        // Act
        await processPullPosition(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.success).toBe(false);
        expect(responseJson.message).toBe("Actual quantity cannot exceed available quantity");
    });
    it("should return 404 when no active asks found for position", async () => {
        // Arrange
        const palletId = "pallet1";
        const posId = testPosition._id.toString();
        const actualQuant = 5;
        mockRequest = {
            params: { palletId, posId },
            body: {
                actualQuant,
                solverId: solverUser._id.toString(),
            },
        };
        vi.mocked(Pos.findById).mockResolvedValue(testPosition);
        vi.mocked(User.findById).mockResolvedValue(solverUser);
        vi.mocked(Ask.find).mockResolvedValue([]); // No active asks
        // Act
        await processPullPosition(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(404);
        expect(responseJson.success).toBe(false);
        expect(responseJson.message).toBe("No active asks found for this position");
    });
    it("should handle database transaction errors", async () => {
        // Arrange
        const palletId = "pallet1";
        const posId = testPosition._id.toString();
        const actualQuant = 5;
        mockRequest = {
            params: { palletId, posId },
            body: {
                actualQuant,
                solverId: solverUser._id.toString(),
            },
        };
        vi.mocked(Pos.findById).mockRejectedValue(new Error("Database connection failed"));
        // Act
        await processPullPosition(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.success).toBe(false);
        expect(responseJson.message).toBe("Database connection failed");
    });
});
