import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../../index.js";
import { createTestUser } from "../../../test/setup.js";
// Mock the pulls controllers
vi.mock("../controllers/getPulls.js", () => ({
    getPulls: vi.fn(),
}));
vi.mock("../controllers/getPullByPalletId.js", () => ({
    getPullByPalletId: vi.fn(),
}));
vi.mock("../controllers/processPullPosition.js", () => ({
    processPullPosition: vi.fn(),
}));
describe("Pulls Router Integration Tests", () => {
    let testUser;
    let authToken;
    beforeEach(async () => {
        // Create test user
        testUser = await createTestUser({
            username: "testuser",
            fullname: "Test User",
            telegram: "@testuser",
            photo: "test-photo.jpg",
            role: "ADMIN", // Admin role for testing
        });
        // Mock authentication middleware to return test user
        vi.doMock("../../../middleware/checkAuth.js", () => ({
            checkAuth: (req, res, next) => {
                req.user = testUser;
                next();
            },
        }));
        vi.doMock("../../../middleware/checkRoles.js", () => ({
            checkRoles: () => (req, res, next) => {
                next();
            },
        }));
        vi.clearAllMocks();
    });
    describe("GET /api/pulls", () => {
        it("should return pulls successfully", async () => {
            // Arrange
            const mockPullsResponse = {
                pulls: [
                    {
                        palletId: "pallet1",
                        palletTitle: "Test Pallet",
                        sector: 1,
                        rowTitle: "Test Row",
                        positions: [],
                        totalAsks: 1,
                    },
                ],
                totalPulls: 1,
                totalAsks: 1,
            };
            const { getPulls } = await import("../controllers/getPulls.js");
            vi.mocked(getPulls).mockImplementation(async (req, res) => {
                res.status(200).json({
                    success: true,
                    message: "Pulls calculated successfully",
                    data: mockPullsResponse,
                });
            });
            // Act
            const response = await request(app)
                .get("/api/pulls")
                .set("Authorization", `Bearer ${authToken}`);
            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.pulls).toHaveLength(1);
            expect(response.body.data.totalPulls).toBe(1);
        });
        it("should handle errors from getPulls controller", async () => {
            // Arrange
            const { getPulls } = await import("../controllers/getPulls.js");
            vi.mocked(getPulls).mockImplementation(async (req, res) => {
                res.status(500).json({
                    success: false,
                    message: "Failed to calculate pulls",
                    error: "Database error",
                });
            });
            // Act
            const response = await request(app)
                .get("/api/pulls")
                .set("Authorization", `Bearer ${authToken}`);
            // Assert
            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Failed to calculate pulls");
        });
    });
    describe("GET /api/pulls/:palletId", () => {
        it("should return pull for specific pallet", async () => {
            // Arrange
            const palletId = "pallet1";
            const mockPull = {
                palletId,
                palletTitle: "Test Pallet",
                sector: 1,
                rowTitle: "Test Row",
                positions: [
                    {
                        posId: "pos1",
                        artikul: "ART001",
                        nameukr: "Test Product",
                        currentQuant: 10,
                        requestedQuant: 5,
                        askId: "ask1",
                        askerData: {
                            _id: "user1",
                            fullname: "Test User",
                            telegram: "@testuser",
                            photo: "test-photo.jpg",
                        },
                    },
                ],
                totalAsks: 1,
            };
            const { getPullByPalletId } = await import("../controllers/getPullByPalletId.js");
            vi.mocked(getPullByPalletId).mockImplementation(async (req, res) => {
                res.status(200).json({
                    success: true,
                    message: "Pull retrieved successfully",
                    data: mockPull,
                });
            });
            // Act
            const response = await request(app)
                .get(`/api/pulls/${palletId}`)
                .set("Authorization", `Bearer ${authToken}`);
            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.palletId).toBe(palletId);
            expect(response.body.data.positions).toHaveLength(1);
        });
        it("should return 404 when pull not found", async () => {
            // Arrange
            const palletId = "nonexistent";
            const { getPullByPalletId } = await import("../controllers/getPullByPalletId.js");
            vi.mocked(getPullByPalletId).mockImplementation(async (req, res) => {
                res.status(404).json({
                    success: false,
                    message: "Pull not found for the specified pallet",
                    data: null,
                });
            });
            // Act
            const response = await request(app)
                .get(`/api/pulls/${palletId}`)
                .set("Authorization", `Bearer ${authToken}`);
            // Assert
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Pull not found for the specified pallet");
        });
        it("should return 400 for invalid pallet ID format", async () => {
            // Arrange
            const invalidPalletId = "invalid-id";
            const { getPullByPalletId } = await import("../controllers/getPullByPalletId.js");
            vi.mocked(getPullByPalletId).mockImplementation(async (req, res) => {
                res.status(400).json({
                    success: false,
                    message: "Invalid pallet ID format",
                });
            });
            // Act
            const response = await request(app)
                .get(`/api/pulls/${invalidPalletId}`)
                .set("Authorization", `Bearer ${authToken}`);
            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Invalid pallet ID format");
        });
    });
    describe("PATCH /api/pulls/:palletId/positions/:posId", () => {
        it("should process pull position successfully", async () => {
            // Arrange
            const palletId = "pallet1";
            const posId = "pos1";
            const requestBody = {
                actualQuant: 5,
                solverId: "solver1",
            };
            const { processPullPosition } = await import("../controllers/processPullPosition.js");
            vi.mocked(processPullPosition).mockImplementation(async (req, res) => {
                res.status(200).json({
                    success: true,
                    message: "Position processed successfully",
                    data: {
                        positionId: posId,
                        palletId,
                        actualQuant: 5,
                        remainingQuant: 10,
                        askCompleted: false,
                        solverName: "Solver User",
                    },
                });
            });
            // Act
            const response = await request(app)
                .patch(`/api/pulls/${palletId}/positions/${posId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send(requestBody);
            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.actualQuant).toBe(5);
            expect(response.body.data.askCompleted).toBe(false);
        });
        it("should return 400 for invalid request body", async () => {
            // Arrange
            const palletId = "pallet1";
            const posId = "pos1";
            const invalidRequestBody = {
                actualQuant: -5, // Invalid negative quantity
                solverId: "solver1",
            };
            const { processPullPosition } = await import("../controllers/processPullPosition.js");
            vi.mocked(processPullPosition).mockImplementation(async (req, res) => {
                res.status(400).json({
                    success: false,
                    message: "Invalid request data",
                    errors: [
                        {
                            code: "too_small",
                            minimum: 0,
                            type: "number",
                            inclusive: true,
                            exact: false,
                            message: "Actual quantity must be non-negative",
                            path: ["actualQuant"],
                        },
                    ],
                });
            });
            // Act
            const response = await request(app)
                .patch(`/api/pulls/${palletId}/positions/${posId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send(invalidRequestBody);
            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Invalid request data");
            expect(response.body.errors).toBeDefined();
        });
        it("should return 404 when position not found", async () => {
            // Arrange
            const palletId = "pallet1";
            const posId = "nonexistent";
            const requestBody = {
                actualQuant: 5,
                solverId: "solver1",
            };
            const { processPullPosition } = await import("../controllers/processPullPosition.js");
            vi.mocked(processPullPosition).mockImplementation(async (req, res) => {
                res.status(404).json({
                    success: false,
                    message: "Position not found",
                });
            });
            // Act
            const response = await request(app)
                .patch(`/api/pulls/${palletId}/positions/${posId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send(requestBody);
            // Assert
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Position not found");
        });
        it("should handle database transaction errors", async () => {
            // Arrange
            const palletId = "pallet1";
            const posId = "pos1";
            const requestBody = {
                actualQuant: 5,
                solverId: "solver1",
            };
            const { processPullPosition } = await import("../controllers/processPullPosition.js");
            vi.mocked(processPullPosition).mockImplementation(async (req, res) => {
                res.status(500).json({
                    success: false,
                    message: "Database connection failed",
                });
            });
            // Act
            const response = await request(app)
                .patch(`/api/pulls/${palletId}/positions/${posId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send(requestBody);
            // Assert
            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Database connection failed");
        });
    });
    describe("Route parameter validation", () => {
        it("should handle invalid ObjectId formats in route parameters", async () => {
            // Arrange
            const invalidPalletId = "invalid-pallet-id";
            const invalidPosId = "invalid-pos-id";
            const { processPullPosition } = await import("../controllers/processPullPosition.js");
            vi.mocked(processPullPosition).mockImplementation(async (req, res) => {
                res.status(400).json({
                    success: false,
                    message: "Invalid pallet ID or position ID format",
                });
            });
            // Act
            const response = await request(app)
                .patch(`/api/pulls/${invalidPalletId}/positions/${invalidPosId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                actualQuant: 5,
                solverId: "solver1",
            });
            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Invalid pallet ID or position ID format");
        });
    });
});
