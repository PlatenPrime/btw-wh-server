import { beforeEach, describe, expect, it } from "vitest";
import { createTestPallet, createTestPos } from "../../../../../../test/utils/testHelpers.js";
import { getPalletByTitleUtil } from "../getPalletByTitleUtil.js";
describe("getPalletByTitleUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("возвращает паллету по title с populate poses", async () => {
        const pallet = await createTestPallet({ title: "Pallet-Test" });
        const pos = await createTestPos({
            pallet: pallet._id,
            palletData: {
                _id: pallet._id,
                title: pallet.title,
                sector: pallet.sector,
                isDef: pallet.isDef,
            },
            palletTitle: pallet.title,
            artikul: "ART-1",
        });
        pallet.poses = [pos._id];
        await pallet.save();
        const result = await getPalletByTitleUtil("Pallet-Test");
        expect(result).not.toBeNull();
        expect(result?.title).toBe("Pallet-Test");
        expect(result?.poses).toBeDefined();
        expect(Array.isArray(result?.poses)).toBe(true);
        expect(result?.poses.length).toBe(1);
    });
    it("возвращает null если паллета не найдена", async () => {
        const result = await getPalletByTitleUtil("NonExistent-Pallet");
        expect(result).toBeNull();
    });
});
