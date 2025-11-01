import { Types } from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { Pallet } from "../../../../../pallets/models/Pallet.js";
import { Pos } from "../../../../../poses/models/Pos.js";
import { Row } from "../../../../models/Row.js";
import { getRowByIdUtil } from "../getRowByIdUtil.js";
describe("getRowByIdUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("возвращает null если ряд не найден", async () => {
        const nonExistentId = new Types.ObjectId().toString();
        const result = await getRowByIdUtil(nonExistentId);
        expect(result).toBeNull();
    });
    it("возвращает ряд с пустым массивом паллет", async () => {
        const row = await Row.create({ title: "Row Without Pallets" });
        const result = await getRowByIdUtil(row._id.toString());
        expect(result).toBeTruthy();
        expect(result?._id.toString()).toBe(row._id.toString());
        expect(result?.title).toBe("Row Without Pallets");
        expect(result?.pallets).toHaveLength(0);
        expect(Array.isArray(result?.pallets)).toBe(true);
    });
    it("возвращает ряд с отсортированными паллетами", async () => {
        const row = await Row.create({ title: "Row With Pallets" });
        const pallet2 = await Pallet.create({
            title: "2-1",
            row: { _id: row._id, title: row.title },
            rowData: { _id: row._id, title: row.title },
            poses: [],
        });
        const pallet1 = await Pallet.create({
            title: "1-1",
            row: { _id: row._id, title: row.title },
            rowData: { _id: row._id, title: row.title },
            poses: [],
        });
        const result = await getRowByIdUtil(row._id.toString());
        expect(result).toBeTruthy();
        expect(result?.pallets).toHaveLength(2);
        // Проверяем что сортировка работает
        expect(result?.pallets[0].title).toBe("1-1");
        expect(result?.pallets[1].title).toBe("2-1");
    });
    it("правильно отмечает пустые паллеты", async () => {
        const row = await Row.create({ title: "Row With Empty Pallets" });
        const emptyPallet = await Pallet.create({
            title: "Empty Pallet",
            row: { _id: row._id, title: row.title },
            rowData: { _id: row._id, title: row.title },
            poses: [],
        });
        const pos = await Pos.create({
            pallet: { _id: emptyPallet._id, title: emptyPallet.title },
            row: { _id: row._id, title: row.title },
            palletData: { _id: emptyPallet._id, title: emptyPallet.title },
            rowData: { _id: row._id, title: row.title },
            palletTitle: emptyPallet.title,
            rowTitle: row.title,
            artikul: "ART-001",
            quant: 10,
            boxes: 2,
        });
        const fullPallet = await Pallet.create({
            title: "Full Pallet",
            row: { _id: row._id, title: row.title },
            rowData: { _id: row._id, title: row.title },
            poses: [pos._id],
        });
        const result = await getRowByIdUtil(row._id.toString());
        expect(result).toBeTruthy();
        expect(result?.pallets).toHaveLength(2);
        const emptyPalletData = result?.pallets.find((p) => p.title === "Empty Pallet");
        const fullPalletData = result?.pallets.find((p) => p.title === "Full Pallet");
        expect(emptyPalletData?.isEmpty).toBe(true);
        expect(fullPalletData?.isEmpty).toBe(false);
    });
    it("возвращает правильные поля паллет", async () => {
        const row = await Row.create({ title: "Row For Fields" });
        const pallet = await Pallet.create({
            title: "Test Pallet",
            row: { _id: row._id, title: row.title },
            rowData: { _id: row._id, title: row.title },
            poses: [],
        });
        const result = await getRowByIdUtil(row._id.toString());
        expect(result).toBeTruthy();
        expect(result?.pallets).toHaveLength(1);
        expect(result?.pallets[0]).toHaveProperty("_id");
        expect(result?.pallets[0]).toHaveProperty("title");
        expect(result?.pallets[0]).toHaveProperty("sector");
        expect(result?.pallets[0]).toHaveProperty("isEmpty");
        expect(result?.pallets[0]).toHaveProperty("isDef");
    });
});
