import { beforeEach, describe, expect, it } from "vitest";
import { createTestRow, createTestPallet } from "../../../../test/utils/testHelpers.js";
import { getAllPalletsByRowIdController } from "../get-all-pallets-by-row-id/getAllPalletsByRowIdController.js";
describe("getAllPalletsByRowIdController", () => {
    let res;
    let responseJson;
    let responseStatus;
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
    });
    it("200: возвращает паллеты по rowId", async () => {
        const row = await createTestRow({ title: "Row 1" });
        await createTestPallet({
            row: row._id,
            rowData: { _id: row._id, title: row.title },
            title: "Pallet-1",
        });
        await createTestPallet({
            row: row._id,
            rowData: { _id: row._id, title: row.title },
            title: "Pallet-2",
        });
        const req = {
            params: { rowId: String(row._id) },
        };
        await getAllPalletsByRowIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(Array.isArray(responseJson)).toBe(true);
        expect(responseJson.length).toBeGreaterThanOrEqual(2);
    });
    it("200: возвращает пустой массив если паллет нет", async () => {
        const row = await createTestRow({ title: "Row 2" });
        const req = {
            params: { rowId: String(row._id) },
        };
        await getAllPalletsByRowIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(Array.isArray(responseJson)).toBe(true);
    });
});
