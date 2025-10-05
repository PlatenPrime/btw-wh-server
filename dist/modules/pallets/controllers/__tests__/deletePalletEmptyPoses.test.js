import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Pos } from "../../../poses/models/Pos.js";
import { Pallet } from "../../models/Pallet.js";
import { deletePalletEmptyPoses } from "../deletePalletEmptyPoses.js";
describe("deletePalletEmptyPoses Controller", () => {
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
    it("should delete empty poses (quant=0, boxes=0) from a specific pallet", async () => {
        // Arrange - Create test data
        const pallet = await Pallet.create({
            title: "Test Pallet",
            row: new Types.ObjectId(),
            rowData: { _id: new Types.ObjectId(), title: "Test Row" },
            poses: [],
        });
        // Create empty poses for this pallet
        const emptyPos1 = await Pos.create({
            pallet: pallet._id,
            row: pallet.row,
            palletData: {
                _id: pallet._id,
                title: pallet.title,
                isDef: false,
            },
            rowData: pallet.rowData,
            palletTitle: pallet.title,
            rowTitle: pallet.rowData.title,
            artikul: "EMPTY001",
            quant: 0,
            boxes: 0,
        });
        const emptyPos2 = await Pos.create({
            pallet: pallet._id,
            row: pallet.row,
            palletData: {
                _id: pallet._id,
                title: pallet.title,
                isDef: false,
            },
            rowData: pallet.rowData,
            palletTitle: pallet.title,
            rowTitle: pallet.rowData.title,
            artikul: "EMPTY002",
            quant: 0,
            boxes: 0,
        });
        // Create non-empty pose that should not be deleted
        const nonEmptyPos = await Pos.create({
            pallet: pallet._id,
            row: pallet.row,
            palletData: {
                _id: pallet._id,
                title: pallet.title,
                isDef: false,
            },
            rowData: pallet.rowData,
            palletTitle: pallet.title,
            rowTitle: pallet.rowData.title,
            artikul: "NONEMPTY001",
            quant: 5,
            boxes: 2,
        });
        // Update pallet with poses
        pallet.poses = [
            emptyPos1._id,
            emptyPos2._id,
            nonEmptyPos._id,
        ];
        await pallet.save();
        mockRequest = {
            params: {
                id: pallet._id.toString(),
            },
        };
        // Act
        await deletePalletEmptyPoses(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Empty poses removed from pallet successfully");
        expect(responseJson.deletedCount).toBe(2);
        expect(responseJson.affectedPoseIds).toHaveLength(2);
        expect(responseJson.affectedPoseIds).toContain(emptyPos1._id.toString());
        expect(responseJson.affectedPoseIds).toContain(emptyPos2._id.toString());
        // Verify empty poses are deleted
        const deletedEmptyPos1 = await Pos.findById(emptyPos1._id);
        const deletedEmptyPos2 = await Pos.findById(emptyPos2._id);
        expect(deletedEmptyPos1).toBeNull();
        expect(deletedEmptyPos2).toBeNull();
        // Verify non-empty pose still exists
        const remainingNonEmptyPos = await Pos.findById(nonEmptyPos._id);
        expect(remainingNonEmptyPos).not.toBeNull();
        // Verify pallet is updated
        const updatedPallet = await Pallet.findById(pallet._id);
        expect(updatedPallet?.poses.map((id) => id.toString())).not.toContain(emptyPos1._id.toString());
        expect(updatedPallet?.poses.map((id) => id.toString())).not.toContain(emptyPos2._id.toString());
        expect(updatedPallet?.poses.map((id) => id.toString())).toContain(nonEmptyPos._id.toString());
    });
    it("should return 400 if pallet id missing", async () => {
        // Arrange
        mockRequest = { params: {} };
        // Act
        await deletePalletEmptyPoses(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Pallet ID is required");
    });
    it("should return 404 if pallet not found", async () => {
        // Arrange
        mockRequest = {
            params: {
                id: new Types.ObjectId().toString(),
            },
        };
        // Act
        await deletePalletEmptyPoses(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Pallet not found");
    });
    it("should return success message when no empty poses exist in pallet", async () => {
        // Arrange - Create pallet with non-empty poses
        const pallet = await Pallet.create({
            title: "Test Pallet",
            row: new Types.ObjectId(),
            rowData: { _id: new Types.ObjectId(), title: "Test Row" },
            poses: [],
        });
        await Pos.create({
            pallet: pallet._id,
            row: pallet.row,
            palletData: {
                _id: pallet._id,
                title: pallet.title,
                isDef: false,
            },
            rowData: pallet.rowData,
            palletTitle: pallet.title,
            rowTitle: pallet.rowData.title,
            artikul: "NONEMPTY001",
            quant: 1,
            boxes: 1,
        });
        mockRequest = {
            params: {
                id: pallet._id.toString(),
            },
        };
        // Act
        await deletePalletEmptyPoses(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("No empty poses found in this pallet");
        expect(responseJson.deletedCount).toBe(0);
    });
    it("should handle poses with only quant=0 but boxes>0", async () => {
        // Arrange
        const pallet = await Pallet.create({
            title: "Test Pallet",
            row: new Types.ObjectId(),
            rowData: { _id: new Types.ObjectId(), title: "Test Row" },
            poses: [],
        });
        // Create pose with quant=0 but boxes>0 (should NOT be deleted)
        await Pos.create({
            pallet: pallet._id,
            row: pallet.row,
            palletData: {
                _id: pallet._id,
                title: pallet.title,
                isDef: false,
            },
            rowData: pallet.rowData,
            palletTitle: pallet.title,
            rowTitle: pallet.rowData.title,
            artikul: "QUANTZERO001",
            quant: 0,
            boxes: 1,
        });
        mockRequest = {
            params: {
                id: pallet._id.toString(),
            },
        };
        // Act
        await deletePalletEmptyPoses(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("No empty poses found in this pallet");
        expect(responseJson.deletedCount).toBe(0);
    });
    it("should handle poses with only boxes=0 but quant>0", async () => {
        // Arrange
        const pallet = await Pallet.create({
            title: "Test Pallet",
            row: new Types.ObjectId(),
            rowData: { _id: new Types.ObjectId(), title: "Test Row" },
            poses: [],
        });
        // Create pose with boxes=0 but quant>0 (should NOT be deleted)
        await Pos.create({
            pallet: pallet._id,
            row: pallet.row,
            palletData: {
                _id: pallet._id,
                title: pallet.title,
                isDef: false,
            },
            rowData: pallet.rowData,
            palletTitle: pallet.title,
            rowTitle: pallet.rowData.title,
            artikul: "BOXESZERO001",
            quant: 1,
            boxes: 0,
        });
        mockRequest = {
            params: {
                id: pallet._id.toString(),
            },
        };
        // Act
        await deletePalletEmptyPoses(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("No empty poses found in this pallet");
        expect(responseJson.deletedCount).toBe(0);
    });
    it("should handle database errors gracefully", async () => {
        // Arrange
        mockRequest = {
            params: {
                id: new Types.ObjectId().toString(),
            },
        };
        // Mock Pallet.findById to throw an error
        vi.spyOn(Pallet, "findById").mockRejectedValueOnce(new Error("Database connection error"));
        // Act
        await deletePalletEmptyPoses(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error during pose deletion");
        expect(responseJson.error).toBeDefined();
    });
    it("should handle transaction errors", async () => {
        // Arrange
        const pallet = await Pallet.create({
            title: "Test Pallet",
            row: new Types.ObjectId(),
            rowData: { _id: new Types.ObjectId(), title: "Test Row" },
            poses: [],
        });
        mockRequest = {
            params: {
                id: pallet._id.toString(),
            },
        };
        // Mock Pos.find to return empty poses but deleteMany to fail
        vi.spyOn(Pos, "find").mockResolvedValueOnce([
            { _id: new Types.ObjectId(), pallet: new Types.ObjectId() },
        ]);
        vi.spyOn(Pos, "deleteMany").mockRejectedValueOnce(new Error("Delete operation failed"));
        // Act
        await deletePalletEmptyPoses(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error during pose deletion");
        expect(responseJson.error).toBeDefined();
    });
    it("should handle validation errors inside transaction", async () => {
        // Arrange
        const pallet = await Pallet.create({
            title: "Test Pallet",
            row: new Types.ObjectId(),
            rowData: { _id: new Types.ObjectId(), title: "Test Row" },
            poses: [],
        });
        mockRequest = {
            params: {
                id: pallet._id.toString(),
            },
        };
        // Mock Pos.find to return empty poses but deleteMany to throw validation error
        const validationError = new Error("Validation failed");
        validationError.name = "ValidationError";
        vi.spyOn(Pos, "find").mockResolvedValueOnce([
            { _id: new Types.ObjectId(), pallet: new Types.ObjectId() },
        ]);
        vi.spyOn(Pos, "deleteMany").mockRejectedValueOnce(validationError);
        // Act
        await deletePalletEmptyPoses(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error during pose deletion");
        expect(responseJson.error).toBeDefined();
    });
    it("should handle cast errors inside transaction", async () => {
        // Arrange
        const pallet = await Pallet.create({
            title: "Test Pallet",
            row: new Types.ObjectId(),
            rowData: { _id: new Types.ObjectId(), title: "Test Row" },
            poses: [],
        });
        mockRequest = {
            params: {
                id: pallet._id.toString(),
            },
        };
        // Mock Pos.find to return empty poses but deleteMany to throw cast error
        const castError = new Error("Invalid ObjectId");
        castError.name = "CastError";
        vi.spyOn(Pos, "find").mockResolvedValueOnce([
            { _id: new Types.ObjectId(), pallet: new Types.ObjectId() },
        ]);
        vi.spyOn(Pos, "deleteMany").mockRejectedValueOnce(castError);
        // Act
        await deletePalletEmptyPoses(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error during pose deletion");
        expect(responseJson.error).toBeDefined();
    });
});
