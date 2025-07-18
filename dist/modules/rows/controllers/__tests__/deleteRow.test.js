import { beforeEach, describe, expect, it, vi } from "vitest";
import { Pallet } from "../../../pallets/models/Pallet.js";
import { Pos } from "../../../poses/models/Pos.js";
import { Row } from "../../models/Row.js";
import { deleteRow } from "../deleteRow.js";
describe("deleteRow Controller", () => {
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
    it("should delete row and return success message", async () => {
        // Arrange
        const row = await Row.create({ title: "ToDelete" });
        mockRequest = { params: { id: String(row._id) } };
        // Act
        await deleteRow(mockRequest, res);
        // Assert
        expect(responseJson.message).toBe("Row and related pallets and positions deleted");
        const deleted = await Row.findById(row._id);
        expect(deleted).toBeNull();
    });
    it("should return 404 if row not found", async () => {
        // Arrange
        mockRequest = { params: { id: "000000000000000000000000" } };
        // Act
        await deleteRow(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Row not found");
    });
    it("should handle server error", async () => {
        // Arrange
        vi.spyOn(Row, "findById").mockRejectedValueOnce(new Error("DB error"));
        mockRequest = { params: { id: "123" } };
        // Act
        await deleteRow(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
        expect(responseJson.error).toBeDefined();
    });
    it("should delete related pallets and positions when row is deleted", async () => {
        // Arrange
        const row = await Row.create({ title: "CascadeRow" });
        const pallet = await Pallet.create({
            title: "CascadePallet",
            row: { _id: row._id, title: row.title },
            rowData: { _id: row._id, title: row.title },
            poses: [],
        });
        const pos = await Pos.create({
            pallet: { _id: pallet._id, title: pallet.title },
            row: { _id: row._id, title: row.title },
            palletData: { _id: pallet._id, title: pallet.title },
            rowData: { _id: row._id, title: row.title },
            palletTitle: pallet.title,
            rowTitle: row.title,
            artikul: "A-1",
            quant: 10,
            boxes: 1,
            limit: 100,
        });
        mockRequest = { params: { id: String(row._id) } };
        // Act
        await deleteRow(mockRequest, res);
        // Assert
        const deletedPallet = await Pallet.findById(pallet._id);
        const deletedPos = await Pos.findById(pos._id);
        expect(deletedPallet).toBeNull();
        expect(deletedPos).toBeNull();
    });
});
