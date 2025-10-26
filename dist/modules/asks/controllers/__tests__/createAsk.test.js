import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoleType } from "../../../../constants/roles.js";
import { createTestUser } from "../../../../test/setup.js";
import { createAsk } from "../createAsk.js";
// Mock the getCurrentFormattedDateTime utility to return a predictable format
vi.mock("../../../utils/getCurrentFormattedDateTime.js", () => ({
    getCurrentFormattedDateTime: vi.fn(() => "15.01.2024 10:30"),
}));
describe("createAsk Controller", () => {
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
    it("should create ask with all required fields", async () => {
        // Arrange
        const testUser = await createTestUser({
            username: "testuser",
            fullname: "Test User",
            telegram: "@testuser",
            photo: "photo.jpg",
        });
        mockRequest = {
            body: {
                artikul: "TEST123",
                nameukr: "Test Product",
                quant: 10,
                com: "Test comment",
                askerId: testUser._id.toString(),
            },
        };
        // Act
        await createAsk(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(201);
        expect(responseJson.artikul).toBe("TEST123");
        expect(responseJson.nameukr).toBe("Test Product");
        expect(responseJson.quant).toBe(10);
        expect(responseJson.com).toBe("Test comment");
        expect(responseJson.asker.toString()).toBe(testUser._id.toString());
        expect(responseJson.status).toBe("new");
        expect(responseJson.askerData).toBeDefined();
        expect(responseJson.askerData.id).toBe(testUser._id.toString());
        expect(responseJson.askerData.fullname).toBe("Test User");
        expect(responseJson.askerData.telegram).toBe("@testuser");
        expect(responseJson.askerData.photo).toBe("photo.jpg");
        expect(responseJson.actions).toHaveLength(1);
        expect(responseJson._id).toBeDefined();
        expect(responseJson.createdAt).toBeDefined();
        expect(responseJson.updatedAt).toBeDefined();
    });
    it("should not send Telegram message for PRIME role users", async () => {
        // Arrange
        const testUser = await createTestUser({
            username: "primeuser",
            fullname: "Prime User",
            role: RoleType.PRIME,
        });
        mockRequest = {
            body: {
                artikul: "PRIME123",
                nameukr: "Prime Product",
                quant: 1,
                askerId: testUser._id.toString(),
            },
        };
        // Act
        await createAsk(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(201);
        expect(responseJson.artikul).toBe("PRIME123");
        // No Telegram message should be sent for PRIME users
    });
    it("should send Telegram message for non-PRIME role users in production", async () => {
        // Arrange
        const testUser = await createTestUser({
            username: "adminuser",
            fullname: "Admin User",
            role: RoleType.ADMIN,
        });
        mockRequest = {
            body: {
                artikul: "ADMIN123",
                nameukr: "Admin Product",
                quant: 1,
                askerId: testUser._id.toString(),
            },
        };
        // Act
        await createAsk(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(201);
        expect(responseJson.artikul).toBe("ADMIN123");
        // In test environment, no Telegram message should be sent due to NODE_ENV=test
    });
    it("should return 404 when user not found", async () => {
        // Arrange
        const nonExistentUserId = new mongoose.Types.ObjectId().toString();
        mockRequest = {
            body: {
                artikul: "USERNOTFOUND123",
                nameukr: "User Not Found Product",
                quant: 1,
                askerId: nonExistentUserId,
            },
        };
        // Act
        await createAsk(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("User not found");
    });
});
