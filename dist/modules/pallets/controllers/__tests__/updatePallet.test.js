import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Pallet } from "../../models/Pallet.js";
import { updatePallet } from "../updatePallet.js";
const createTestPallet = async (palletData = {}) => {
    return await Pallet.create({
        title: palletData.title || `Test Pallet ${Date.now()}`,
        row: palletData.row || { _id: new Types.ObjectId(), title: "Test Row" },
        rowData: palletData.rowData ||
            palletData.row || { _id: new Types.ObjectId(), title: "Test Row" },
        poses: palletData.poses || [],
        sector: palletData.sector,
    });
};
describe("updatePallet Controller", () => {
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
    it("should update pallet by ID", async () => {
        // Arrange
        const testPallet = await createTestPallet();
        mockRequest = {
            params: { id: testPallet.id },
            body: { title: "Updated Pallet" },
        };
        // Act
        await updatePallet(mockRequest, res);
        // Debug: log error if not 200
        if (responseStatus.code !== 200) {
            // eslint-disable-next-line no-console
            console.error("Test updatePallet: ", responseStatus, responseJson);
        }
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.title).toBe("Updated Pallet");
    });
    it("should return 404 if pallet not found", async () => {
        // Arrange
        mockRequest = {
            params: { id: new Types.ObjectId().toString() },
            body: { title: "No Pallet" },
        };
        // Act
        await updatePallet(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Pallet not found");
    });
    it("should return 400 for invalid update data", async () => {
        // Arrange
        const testPallet = await createTestPallet();
        mockRequest = { params: { id: testPallet.id }, body: { title: "" } };
        // Act
        await updatePallet(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBeDefined();
    });
    it("should handle server error", async () => {
        // Arrange
        const testPallet = await createTestPallet();
        mockRequest = { params: { id: testPallet.id }, body: { title: "Err" } };
        vi.spyOn(Pallet.prototype, "save").mockRejectedValueOnce(new Error("DB error"));
        // Act
        await updatePallet(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
        expect(responseJson.error).toBeDefined();
    });
});
