import { beforeEach, describe, expect, it } from "vitest";
import { createTestPallet, createTestPos, createTestRow, } from "../../../../../../test/utils/testHelpers.js";
import { getPosesByArtikulUtil } from "../getPosesByArtikulUtil.js";
describe("getPosesByArtikulUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("возвращает все позиции по артикулу", async () => {
        const row = await createTestRow();
        const pallet = await createTestPallet({
            row: { _id: row._id, title: row.title },
        });
        await createTestPos({
            pallet: { _id: pallet._id, title: pallet.title },
            row: { _id: row._id, title: row.title },
            artikul: "ART-SAME",
        });
        await createTestPos({
            pallet: { _id: pallet._id, title: pallet.title },
            row: { _id: row._id, title: row.title },
            artikul: "ART-SAME",
        });
        const poses = await getPosesByArtikulUtil("ART-SAME");
        expect(poses.length).toBeGreaterThanOrEqual(2);
        expect(poses.every((p) => p.artikul === "ART-SAME")).toBe(true);
    });
    it("возвращает пустой массив для несуществующего артикула", async () => {
        const poses = await getPosesByArtikulUtil("NON-EXISTENT");
        expect(poses).toEqual([]);
    });
});
