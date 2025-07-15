import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Pos } from "../../../poses/models/Pos.js";
import { Row } from "../../../rows/models/Row.js";
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
    it("should move poses from source to target pallet", async () => {
        // Arrange
        const row = (await Row.create({ title: "Row", pallets: [] }));
        const poseId = new Types.ObjectId();
        const sourcePallet = (await Pallet.create({
            title: "Source",
            row: { _id: row._id, title: row.title },
            poses: [poseId],
        }));
        const targetPallet = (await Pallet.create({
            title: "Target",
            row: { _id: row._id, title: row.title },
            poses: [],
        }));
        await Pos.create({
            pallet: { _id: sourcePallet._id, title: sourcePallet.title },
            row: { _id: row._id, title: row.title },
            palletTitle: sourcePallet.title,
            rowTitle: row.title,
            artikul: "A1",
            quant: 1,
            boxes: 1,
        });
        mockRequest = {
            body: {
                sourcePalletId: sourcePallet._id.toString(),
                targetPalletId: targetPallet._id.toString(),
            },
        };
        // Act
        await movePalletPoses(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Poses moved successfully");
        expect(responseJson.targetPallet._id).toBe(targetPallet._id.toString());
    });
    it("should return 400 for invalid input schema", async () => {
        mockRequest = { body: { sourcePalletId: "bad", targetPalletId: "bad" } };
        await movePalletPoses(mockRequest, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Invalid input");
    });
    it("should return 400 if source and target IDs are equal", async () => {
        const id = new Types.ObjectId().toString();
        mockRequest = { body: { sourcePalletId: id, targetPalletId: id } };
        await movePalletPoses(mockRequest, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toMatch(/must be different/);
    });
    it("should return 404 if source pallet not found", async () => {
        const row = (await Row.create({ title: "Row", pallets: [] }));
        const targetPallet = (await Pallet.create({
            title: "Target",
            row: { _id: row._id, title: row.title },
            poses: [],
        }));
        mockRequest = {
            body: {
                sourcePalletId: new Types.ObjectId().toString(),
                targetPalletId: targetPallet._id.toString(),
            },
        };
        await movePalletPoses(mockRequest, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Source pallet not found");
    });
    it("should return 404 if target pallet not found", async () => {
        const row = (await Row.create({ title: "Row", pallets: [] }));
        const sourcePallet = (await Pallet.create({
            title: "Source",
            row: { _id: row._id, title: row.title },
            poses: [new Types.ObjectId()],
        }));
        mockRequest = {
            body: {
                sourcePalletId: sourcePallet._id.toString(),
                targetPalletId: new Types.ObjectId().toString(),
            },
        };
        await movePalletPoses(mockRequest, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Target pallet not found");
    });
    it("should return 400 if target pallet is not empty", async () => {
        const row = (await Row.create({ title: "Row", pallets: [] }));
        const poseId = new Types.ObjectId();
        const sourcePallet = (await Pallet.create({
            title: "Source",
            row: { _id: row._id, title: row.title },
            poses: [poseId],
        }));
        const targetPallet = (await Pallet.create({
            title: "Target",
            row: { _id: row._id, title: row.title },
            poses: [new Types.ObjectId()],
        }));
        mockRequest = {
            body: {
                sourcePalletId: sourcePallet._id.toString(),
                targetPalletId: targetPallet._id.toString(),
            },
        };
        await movePalletPoses(mockRequest, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Target pallet must be empty");
    });
    it("should return 400 if source pallet has no poses", async () => {
        const row = (await Row.create({ title: "Row", pallets: [] }));
        const sourcePallet = (await Pallet.create({
            title: "Source",
            row: { _id: row._id, title: row.title },
            poses: [],
        }));
        const targetPallet = (await Pallet.create({
            title: "Target",
            row: { _id: row._id, title: row.title },
            poses: [],
        }));
        mockRequest = {
            body: {
                sourcePalletId: sourcePallet._id.toString(),
                targetPalletId: targetPallet._id.toString(),
            },
        };
        await movePalletPoses(mockRequest, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Source pallet has no poses to move");
    });
    it("should return 404 if target row not found", async () => {
        const row = (await Row.create({ title: "Row", pallets: [] }));
        const poseId = new Types.ObjectId();
        const sourcePallet = (await Pallet.create({
            title: "Source",
            row: { _id: row._id, title: row.title },
            poses: [poseId],
        }));
        const targetPallet = (await Pallet.create({
            title: "Target",
            row: { _id: new Types.ObjectId(), title: "Missing Row" },
            poses: [],
        }));
        mockRequest = {
            body: {
                sourcePalletId: sourcePallet._id.toString(),
                targetPalletId: targetPallet._id.toString(),
            },
        };
        await movePalletPoses(mockRequest, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Target row not found");
    });
    it("should handle server error", async () => {
        // Arrange
        const row = (await Row.create({ title: "Row", pallets: [] }));
        const poseId = new Types.ObjectId();
        const sourcePallet = (await Pallet.create({
            title: "Source",
            row: { _id: row._id, title: row.title },
            poses: [poseId],
        }));
        const targetPallet = (await Pallet.create({
            title: "Target",
            row: { _id: row._id, title: row.title },
            poses: [],
        }));
        mockRequest = {
            body: {
                sourcePalletId: sourcePallet._id.toString(),
                targetPalletId: targetPallet._id.toString(),
            },
        };
        vi.spyOn(Pallet.prototype, "save").mockRejectedValueOnce(new Error("DB error"));
        await movePalletPoses(mockRequest, res);
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
        expect(responseJson.error).toBeDefined();
    });
});
