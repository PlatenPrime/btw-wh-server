import { beforeEach, describe, expect, it, vi } from "vitest";
import { Pallet } from "../../../pallets/models/Pallet.js";
import { Pos } from "../../../poses/models/Pos.js";
import { Row } from "../../models/Row.js";
import { createRow } from "../createRow.js";
describe("createRow Controller", () => {
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
    it("should create a row and return 201", async () => {
        // Arrange
        mockRequest = { body: { title: "Test Row" } };
        // Act
        await createRow(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(201);
        expect(responseJson.title).toBe("Test Row");
        expect(responseJson._id).toBeDefined();
        // Clean up
        await Row.deleteOne({ _id: responseJson._id });
    });
    it("should return 500 if title is missing", async () => {
        // Arrange
        mockRequest = { body: {} };
        // Act
        await createRow(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
        expect(responseJson.error).toBeDefined();
    });
    it("should handle server error", async () => {
        // Arrange
        vi.spyOn(Row.prototype, "save").mockRejectedValueOnce(new Error("DB error"));
        mockRequest = { body: { title: "Row" } };
        // Act
        await createRow(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
        expect(responseJson.error).toBeDefined();
    });
    it("should allow creating Pallet and Pos linked to Row", async () => {
        // Arrange
        mockRequest = { body: { title: "RowForLinks" } };
        await createRow(mockRequest, res);
        const rowId = responseJson._id;
        const rowTitle = responseJson.title;
        // Создаем паллету, связанную с рядом
        const pallet = await Pallet.create({
            title: "PalletForRow",
            row: { _id: rowId, title: rowTitle },
            poses: [],
        });
        // Создаем позицию, связанную с паллетой и рядом
        const pos = await Pos.create({
            pallet: { _id: pallet._id, title: pallet.title },
            row: { _id: rowId, title: rowTitle },
            palletTitle: pallet.title,
            rowTitle: rowTitle,
            artikul: "A-2",
            quant: 5,
            boxes: 2,
        });
        // Assert
        expect(pallet.row._id.toString()).toBe(String(rowId));
        expect(pallet.row.title).toBe(rowTitle);
        expect(String(pos.pallet._id)).toBe(String(pallet._id));
        expect(pos.row._id.toString()).toBe(String(rowId));
        expect(pos.palletTitle).toBe(pallet.title);
        expect(pos.rowTitle).toBe(rowTitle);
    });
});
