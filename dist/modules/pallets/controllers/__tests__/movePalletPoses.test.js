import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Pallet } from "../../models/Pallet.js";
import { movePalletPoses } from "../movePalletPoses.js";
describe("movePalletPoses Controller", () => {
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
    it("should move poses for a pallet", async () => {
        // Arrange
        const pallet = await Pallet.create({
            title: "Move Pallet",
            row: { _id: new Types.ObjectId(), title: "Row" },
            poses: [new Types.ObjectId()],
        });
        mockRequest = {
            body: {
                palletId: pallet.id,
                poses: [new Types.ObjectId().toString()],
            },
        };
        // Act
        await movePalletPoses(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBeDefined();
    });
    it("should return 400 if palletId or poses missing", async () => {
        // Arrange
        mockRequest = { body: { poses: [new Types.ObjectId().toString()] } };
        await movePalletPoses(mockRequest, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBeDefined();
        mockRequest = { body: { palletId: new Types.ObjectId().toString() } };
        await movePalletPoses(mockRequest, res);
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
        await movePalletPoses(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
        expect(responseJson.error).toBeDefined();
    });
});
