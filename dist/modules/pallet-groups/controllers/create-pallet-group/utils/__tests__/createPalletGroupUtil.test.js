import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../../test/setup.js";
import { PalletGroup } from "../../../../models/PalletGroup.js";
import { createPalletGroupUtil } from "../createPalletGroupUtil.js";
describe("createPalletGroupUtil", () => {
    beforeEach(async () => {
        await PalletGroup.deleteMany({});
    });
    it("creates group with next order when order is not provided", async () => {
        await PalletGroup.create({ title: "Group A", order: 1, pallets: [] });
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const group = await createPalletGroupUtil({
                title: "Group B",
                session,
            });
            await session.commitTransaction();
            expect(group.title).toBe("Group B");
            expect(group.order).toBe(2);
        }
        finally {
            session.endSession();
        }
    });
    it("inserts group at specified order and shifts others", async () => {
        const g1 = await PalletGroup.create({
            title: "Group A",
            order: 1,
            pallets: [],
        });
        const g2 = await PalletGroup.create({
            title: "Group B",
            order: 2,
            pallets: [],
        });
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const group = await createPalletGroupUtil({
                title: "Group C",
                order: 1,
                session,
            });
            await session.commitTransaction();
            expect(group.order).toBe(1);
            const after = await PalletGroup.find({}).sort({ order: 1 }).lean();
            expect(after).toHaveLength(3);
            expect(after[0].title).toBe("Group C");
            expect(after[1].title).toBe("Group A");
            expect(after[2].title).toBe("Group B");
            expect(after[1].order).toBe(2);
            expect(after[2].order).toBe(3);
        }
        finally {
            session.endSession();
        }
        expect(g1._id).toBeDefined();
        expect(g2._id).toBeDefined();
    });
    it("throws when title already exists", async () => {
        await PalletGroup.create({ title: "Existing", order: 1, pallets: [] });
        const session = await mongoose.startSession();
        session.startTransaction();
        await expect(createPalletGroupUtil({ title: "Existing", session })).rejects.toThrow("Pallet group with this title already exists");
        await session.abortTransaction();
        session.endSession();
    });
});
