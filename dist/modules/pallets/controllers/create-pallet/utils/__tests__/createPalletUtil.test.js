import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestRow } from "../../../../../../test/utils/testHelpers.js";
import { Row } from "../../../../../rows/models/Row.js";
import { Pallet } from "../../../../models/Pallet.js";
import { createPalletUtil } from "../createPalletUtil.js";
describe("createPalletUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("создаёт паллету в транзакции и обновляет Row", async () => {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const row = await createTestRow({ title: "Row 1" });
            const result = await createPalletUtil({
                title: "Pallet-1-1",
                rowId: String(row._id),
                sector: "A",
                isDef: false,
                rowData: row,
                session,
            });
            expect(result).toBeTruthy();
            expect(result._id).toBeDefined();
            expect(result.title).toBe("Pallet-1-1");
            expect(result.sector).toBe("A");
            expect(result.isDef).toBe(false);
            const found = await Pallet.findById(result._id).session(session);
            expect(found).not.toBeNull();
            expect(found?.title).toBe("Pallet-1-1");
            const updatedRow = await Row.findById(row._id).session(session);
            expect(updatedRow?.pallets).toContainEqual(found?._id);
        });
        await session.endSession();
    });
});
