import { beforeEach, describe, expect, it } from "vitest";
import { createTestPallet, createTestPos, createTestRow, } from "../../../../../../test/utils/testHelpers.js";
import { populateMissingPosDataUtil } from "../populateMissingPosDataUtil.js";
describe("populateMissingPosDataUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("находит и заполняет позиции с отсутствующими данными", async () => {
        const row = await createTestRow();
        const pallet = await createTestPallet({
            row: { _id: row._id, title: row.title },
        });
        // Создаём позицию без palletData
        const pos = await createTestPos({
            pallet: { _id: pallet._id, title: pallet.title },
            row: { _id: row._id, title: row.title },
        });
        // Удаляем palletData через прямое обновление MongoDB
        await pos.collection.updateOne({ _id: pos._id }, { $unset: { palletData: "" } });
        const result = await populateMissingPosDataUtil();
        expect(result.updated).toBeGreaterThanOrEqual(1);
        expect(result.errors).toBe(0);
        // Проверяем что данные заполнены - перезагружаем документ из базы
        const Pos = (await import("../../../../models/Pos.js")).Pos;
        const updatedPos = await Pos.findById(pos._id);
        expect(updatedPos).toBeDefined();
        expect(updatedPos.palletData).toBeDefined();
    });
    it("обрабатывает ошибки при заполнении", async () => {
        // Создаём позицию с несуществующим pallet
        const mongoose = await import("mongoose");
        const row = await createTestRow();
        const pos = await createTestPos({
            pallet: { _id: new mongoose.Types.ObjectId(), title: "Non-existent" },
            row: { _id: row._id, title: row.title },
        });
        // Удаляем palletData через прямое обновление MongoDB
        await pos.collection.updateOne({ _id: pos._id }, { $unset: { palletData: "" } });
        const result = await populateMissingPosDataUtil();
        expect(result.errors).toBeGreaterThanOrEqual(1);
        expect(result.errorDetails.length).toBeGreaterThanOrEqual(1);
        expect(result.errorDetails[0].posId).toBe(pos._id.toString());
    });
});
