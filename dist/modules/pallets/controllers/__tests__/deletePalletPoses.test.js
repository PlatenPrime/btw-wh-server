import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Pallet } from "../../models/Pallet.js";
import { deletePalletPoses } from "../deletePalletPoses.js";
describe("deletePalletPoses Controller", () => {
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
    it("should delete poses from a pallet", async () => {
        // Arrange
        const poseId = new Types.ObjectId();
        const pallet = await Pallet.create({
            title: "DeletePoses Pallet",
            row: { _id: new Types.ObjectId(), title: "Row" },
            poses: [poseId],
        });
        mockRequest = {
            body: {
                palletId: pallet.id,
                poses: [poseId.toString()],
            },
        };
        // Act
        await deletePalletPoses(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBeDefined();
    });
    it("should return 400 if palletId or poses missing", async () => {
        // Arrange
        mockRequest = { body: { poses: [new Types.ObjectId().toString()] } };
        await deletePalletPoses(mockRequest, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBeDefined();
        mockRequest = { body: { palletId: new Types.ObjectId().toString() } };
        await deletePalletPoses(mockRequest, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBeDefined();
    });
    it("should handle server error", async () => {
        // Arrange
        mockRequest = {
            body: {
                palletId: new Types.ObjectId().toString(),
                poses: [new Types.ObjectId().toString()],
            },
        };
        vi.spyOn(Pallet, "findByIdAndUpdate").mockRejectedValueOnce(new Error("DB error"));
        // Act
        await deletePalletPoses(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
        expect(responseJson.error).toBeDefined();
    });
});
