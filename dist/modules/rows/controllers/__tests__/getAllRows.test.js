import { beforeEach, describe, expect, it, vi } from "vitest";
import { Pallet } from "../../../pallets/models/Pallet.js";
import { Row } from "../../models/Row.js";
import { getAllRows } from "../getAllRows.js";
// Вспомогательная функция для создания тестового ряда
const createTestRow = async (rowData = {}) => {
    return await Row.create({
        title: rowData.title || `Test Row ${Date.now()}`,
        pallets: rowData.pallets || [],
    });
};
describe("getAllRows Controller", () => {
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
    it("should return all rows sorted by title", async () => {
        // Arrange
        await createTestRow({ title: "B Row" });
        await createTestRow({ title: "A Row" });
        mockRequest = {};
        // Act
        await getAllRows(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(200);
        expect(Array.isArray(responseJson)).toBe(true);
        expect(responseJson.length).toBe(2);
        expect(responseJson[0].title).toBe("A Row");
        expect(responseJson[1].title).toBe("B Row");
    });
    it("should return 404 if no rows found", async () => {
        // Arrange
        mockRequest = {};
        // Act
        await getAllRows(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Rows not found");
    });
    it("should handle server error", async () => {
        // Arrange
        vi.spyOn(Row, "find").mockRejectedValueOnce(new Error("DB error"));
        mockRequest = {};
        // Act
        await getAllRows(mockRequest, res);
        // Assert
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
        expect(responseJson.error).toBeDefined();
    });
    it("should return rows with correct pallet references", async () => {
        // Arrange
        const row = await createTestRow({ title: "RowWithPallets" });
        const pallet = await Pallet.create({
            title: "PalletForGetAll",
            row: { _id: row._id, title: row.title },
            poses: [],
        });
        // Добавим pallet в массив pallets у row
        row.pallets.push(pallet._id);
        await row.save();
        mockRequest = {};
        // Act
        await getAllRows(mockRequest, res);
        // Assert
        const foundRow = responseJson.find((r) => r._id.toString() === row._id.toString());
        expect(foundRow).toBeDefined();
        expect(Array.isArray(foundRow.pallets)).toBe(true);
        expect(foundRow.pallets[0].toString()).toBe(pallet._id.toString());
        // Проверим, что pallet ссылается на row
        expect(pallet.row._id.toString()).toBe(row._id.toString());
    });
});
