import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestPallet, createTestPos, createTestRow, } from "../../../../../../test/utils/testHelpers.js";
import { populateRowDataUtil } from "../populateRowDataUtil.js";
describe("populateRowDataUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("заполняет rowData и row для позиции по row ObjectId", async () => {
        const row = await createTestRow({ title: "Test Row" });
        const pallet = await createTestPallet({
            row: { _id: row._id, title: row.title },
        });
        const pos = await createTestPos({
            pallet: { _id: pallet._id, title: pallet.title },
            row: { _id: row._id, title: row.title },
        });
        // Удаляем rowData для теста через прямое обновление MongoDB
        await pos.collection.updateOne({ _id: pos._id }, { $unset: { rowData: "" } });
        // Перезагружаем документ из базы без валидации
        const Pos = (await import("../../../../models/Pos.js")).Pos;
        const updatedPos = await Pos.findById(pos._id).lean();
        if (!updatedPos)
            throw new Error("Pos not found");
        pos.rowData = undefined;
        const result = await populateRowDataUtil(pos);
        expect(result._id.toString()).toBe(row._id.toString());
        expect(pos.rowData).toBeDefined();
        expect(pos.rowData._id.toString()).toBe(row._id.toString());
        expect(pos.rowData.title).toBe("Test Row");
    });
    it("находит Row по rowTitle если row отсутствует", async () => {
        const row = await createTestRow({ title: "Find By Title" });
        const pallet = await createTestPallet({
            row: { _id: row._id, title: row.title },
        });
        const pos = await createTestPos({
            pallet: { _id: pallet._id, title: pallet.title },
            row: { _id: row._id, title: row.title },
            rowTitle: "Find By Title",
        });
        // Удаляем row и rowData через прямое обновление MongoDB
        await pos.collection.updateOne({ _id: pos._id }, { $unset: { row: "", rowData: "" } });
        // Перезагружаем документ из базы без валидации
        const Pos = (await import("../../../../models/Pos.js")).Pos;
        const updatedPos = await Pos.findById(pos._id).lean();
        if (!updatedPos)
            throw new Error("Pos not found");
        pos.row = undefined;
        pos.rowData = undefined;
        const result = await populateRowDataUtil(pos);
        expect(result._id.toString()).toBe(row._id.toString());
        expect(pos.row).toBeDefined();
        expect(pos.rowData).toBeDefined();
        expect(pos.rowData.title).toBe("Find By Title");
    });
    it("выбрасывает ошибку если ряд не найден", async () => {
        const pallet = await createTestPallet();
        const pos = await createTestPos({
            pallet: { _id: pallet._id, title: pallet.title },
            rowTitle: "Non-existent Row",
        });
        // Удаляем rowData и устанавливаем несуществующий row через MongoDB
        const fakeRowId = new mongoose.Types.ObjectId();
        await pos.collection.updateOne({ _id: pos._id }, { $set: { row: fakeRowId }, $unset: { rowData: "" } });
        // Перезагружаем документ из базы без валидации
        const Pos = (await import("../../../../models/Pos.js")).Pos;
        const updatedPos = await Pos.findById(pos._id).lean();
        if (!updatedPos)
            throw new Error("Pos not found");
        pos.row = fakeRowId;
        pos.rowData = undefined;
        await expect(populateRowDataUtil(pos)).rejects.toThrow("Row not found");
    });
});
