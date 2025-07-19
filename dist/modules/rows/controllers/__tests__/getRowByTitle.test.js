import { beforeEach, describe, expect, it, vi } from "vitest";
import { Pallet } from "../../../pallets/models/Pallet.js";
import { Row } from "../../models/Row.js";
import { getRowByTitle } from "../getRowByTitle.js";
describe("getRowByTitle Controller", () => {
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
    it("should return row by title", async () => {
        // Arrange
        const row = await Row.create({ title: "UniqueTitle" });
        // Создаем паллету, связанную с этим рядом
        const pallet = await Pallet.create({
            title: "Pallet for UniqueTitle",
            row: row._id, // Add this line to set the required row field
            rowData: { _id: row._id, title: row.title },
            sector: "test-sector",
        });
        mockRequest = { params: { title: "UniqueTitle" } };
        // Act
        await getRowByTitle(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(responseJson.title).toBe("UniqueTitle");
        expect(responseJson._id).toBeDefined();
        // Проверяем pallets
        expect(Array.isArray(responseJson.pallets)).toBe(true);
        expect(responseJson.pallets.length).toBe(1);
        expect(responseJson.pallets[0]._id.toString()).toBe(pallet._id.toString());
        expect(responseJson.pallets[0].title).toBe(pallet.title);
        expect(responseJson.pallets[0].sector).toBe(pallet.sector);
    });
    it("should return 404 if row not found", async () => {
        // Arrange
        mockRequest = { params: { title: "NotExist" } };
        // Act
        await getRowByTitle(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Row not found");
    });
    it("should handle server error", async () => {
        // Arrange
        vi.spyOn(Row, "findOne").mockRejectedValueOnce(new Error("DB error"));
        mockRequest = { params: { title: "Any" } };
        // Act
        await getRowByTitle(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
        expect(responseJson.error).toBeDefined();
    });
});
