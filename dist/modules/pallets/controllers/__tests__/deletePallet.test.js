import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Pallet } from "../../models/Pallet.js";
import { deletePallet } from "../deletePallet.js";
const createTestPallet = async (palletData = {}) => {
    return await Pallet.create({
        title: palletData.title || `Test Pallet ${Date.now()}`,
        row: palletData.row || { _id: new Types.ObjectId(), title: "Test Row" },
        poses: palletData.poses || [],
        sector: palletData.sector,
    });
};
describe("deletePallet Controller", () => {
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
    it("should delete pallet by ID", async () => {
        // Arrange
        const testPallet = await createTestPallet();
        mockRequest = { params: { id: testPallet.id } };
        // Act
        await deletePallet(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Pallet deleted");
    });
    it("should return 404 if pallet not found", async () => {
        // Arrange
        mockRequest = { params: { id: new Types.ObjectId().toString() } };
        // Act
        await deletePallet(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Pallet not found");
    });
    it("should handle server error", async () => {
        // Arrange
        mockRequest = { params: { id: new Types.ObjectId().toString() } };
        vi.spyOn(Pallet, "findByIdAndDelete").mockRejectedValueOnce(new Error("DB error"));
        // Act
        await deletePallet(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
        expect(responseJson.error).toBeDefined();
    });
});
