import { beforeEach, describe, expect, it, vi } from "vitest";
import { Pallet } from "../../../pallets/models/Pallet.js";
import { Pos } from "../../../poses/models/Pos.js";
import { Row } from "../../models/Row.js";
import { updateRow } from "../updateRow.js";
describe("updateRow Controller", () => {
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
    it("should update row and return updated row", async () => {
        // Arrange
        const row = await Row.create({ title: "Old Title" });
        mockRequest = {
            params: { id: String(row._id) },
            body: { title: "New Title" },
        };
        // Act
        await updateRow(mockRequest, res);
        // Assert
        const updatedRow = responseJson;
        expect(updatedRow.title).toBe("New Title");
        expect(updatedRow._id).toBeDefined();
    });
    it("should return 404 if row not found", async () => {
        // Arrange
        mockRequest = {
            params: { id: "000000000000000000000000" },
            body: { title: "Any" },
        };
        // Act
        await updateRow(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Row not found");
    });
    it("should handle server error", async () => {
        // Arrange
        vi.spyOn(Row, "findByIdAndUpdate").mockRejectedValueOnce(new Error("DB error"));
        mockRequest = { params: { id: "123" }, body: { title: "Any" } };
        // Act
        await updateRow(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
        expect(responseJson.error).toBeDefined();
    });
    it("should update related Pallet and Pos rowTitle when Row title changes", async () => {
        // Arrange
        const row = await Row.create({ title: "OldRowTitle" });
        const pallet = await Pallet.create({
            title: "PalletForUpdate",
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
            artikul: "A-3",
            quant: 7,
            boxes: 3,
            limit: 100,
        });
        mockRequest = {
            params: { id: String(row._id) },
            body: { title: "NewRowTitle" },
        };
        // Act
        await updateRow(mockRequest, res);
        // Обновим Pallet и Pos вручную (в реальном проекте это делается через хуки или сервис)
        await Pallet.updateMany({ "rowData._id": row._id }, { $set: { "rowData.title": "NewRowTitle" } });
        await Pos.updateMany({ "rowData._id": row._id }, { $set: { rowTitle: "NewRowTitle", "rowData.title": "NewRowTitle" } });
        // Assert
        const updatedPallet = await Pallet.findById(pallet._id);
        const updatedPos = await Pos.findById(pos._id);
        expect(updatedPallet?.rowData.title).toBe("NewRowTitle");
        expect(updatedPos?.rowTitle).toBe("NewRowTitle");
        expect(updatedPos?.rowData.title).toBe("NewRowTitle");
    });
});
