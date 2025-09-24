import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "../../../../test/setup";
import { Pallet } from "../../../pallets/models/Pallet.js";
import { Row } from "../../../rows/models/Row.js";
import { Pos } from "../../models/Pos.js";
import { populateMissingPosData } from "../populateMissingPosData.js";
describe("populateMissingPosData Controller", () => {
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
    it("should populate missing palletData with isDef field", async () => {
        // Arrange
        const row = await Row.create({
            _id: new Types.ObjectId(),
            title: "Test Row",
            pallets: [],
        });
        const pallet = await Pallet.create({
            title: "Test Pallet",
            row: row._id,
            rowData: { _id: row._id, title: row.title },
            poses: [],
            isDef: true,
        });
        const pos = await Pos.create({
            pallet: pallet._id,
            row: row._id,
            palletData: {
                _id: pallet._id,
                title: pallet.title,
                sector: pallet.sector,
                isDef: pallet.isDef,
            },
            rowData: {
                _id: row._id,
                title: row.title,
            },
            palletTitle: pallet.title,
            rowTitle: row.title,
            artikul: "ART-1",
            quant: 5,
            boxes: 1,
            limit: 100,
        });
        // Remove palletData to simulate missing data
        await Pos.findByIdAndUpdate(pos._id, { $unset: { palletData: 1 } });
        mockRequest = {};
        // Act
        await populateMissingPosData(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.updated).toBe(1);
        expect(responseJson.errors).toBe(0);
        // Verify that palletData was populated with isDef
        const updatedPos = await Pos.findById(pos._id);
        expect(updatedPos?.palletData?.isDef).toBe(true);
        expect(updatedPos?.palletData?.title).toBe("Test Pallet");
    });
    it("should handle missing row by rowTitle", async () => {
        // Arrange
        const row = await Row.create({
            _id: new Types.ObjectId(),
            title: "Test Row",
            pallets: [],
        });
        const pallet = await Pallet.create({
            title: "Test Pallet",
            row: row._id,
            rowData: { _id: row._id, title: row.title },
            poses: [],
            isDef: false,
        });
        const pos = await Pos.create({
            pallet: pallet._id,
            row: row._id,
            palletData: {
                _id: pallet._id,
                title: pallet.title,
                sector: pallet.sector,
                isDef: pallet.isDef,
            },
            rowData: {
                _id: row._id,
                title: row.title,
            },
            palletTitle: pallet.title,
            rowTitle: row.title,
            artikul: "ART-2",
            quant: 3,
            boxes: 1,
            limit: 100,
        });
        // Remove row reference and rowData
        await Pos.findByIdAndUpdate(pos._id, { $unset: { row: 1, rowData: 1 } });
        mockRequest = {};
        // Act
        await populateMissingPosData(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.updated).toBe(1);
        expect(responseJson.errors).toBe(0);
        // Verify that both palletData and rowData were populated
        const updatedPos = await Pos.findById(pos._id);
        expect(updatedPos?.palletData?.isDef).toBe(false);
        expect(updatedPos?.rowData?.title).toBe("Test Row");
    });
    it("should handle errors gracefully", async () => {
        // Arrange
        const pos = await Pos.create({
            pallet: new Types.ObjectId(),
            row: new Types.ObjectId(),
            palletData: {
                _id: new Types.ObjectId(),
                title: "Non-existent Pallet",
                sector: undefined,
                isDef: false,
            },
            rowData: {
                _id: new Types.ObjectId(),
                title: "Non-existent Row",
            },
            palletTitle: "Non-existent Pallet",
            rowTitle: "Non-existent Row",
            artikul: "ART-3",
            quant: 1,
            boxes: 1,
            limit: 100,
        });
        // Remove palletData to trigger error
        await Pos.findByIdAndUpdate(pos._id, { $unset: { palletData: 1 } });
        mockRequest = {};
        // Act
        await populateMissingPosData(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.updated).toBe(0);
        expect(responseJson.errors).toBe(1);
        expect(responseJson.errorDetails).toHaveLength(1);
        expect(responseJson.errorDetails[0].reason).toContain("Pallet not found");
    });
    it("should return 500 on server error", async () => {
        // Arrange
        mockRequest = {};
        vi.spyOn(Pos, "find").mockRejectedValueOnce(new Error("Database error"));
        // Act
        await populateMissingPosData(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.error).toBe("Database error");
    });
});
