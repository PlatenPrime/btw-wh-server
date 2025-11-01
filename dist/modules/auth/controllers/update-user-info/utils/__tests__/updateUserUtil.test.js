import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../../test/setup.js";
import User from "../../../../models/User.js";
import { updateUserUtil } from "../updateUserUtil.js";
describe("updateUserUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("обновляет пользователя в транзакции", async () => {
        const user = await createTestUser({
            username: `testuser-${Date.now()}`,
            fullname: "Old Name",
        });
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const updated = await updateUserUtil({
                userId: user._id.toString(),
                updateData: { fullname: "New Name" },
                session,
            });
            expect(updated).toBeTruthy();
            expect(updated?.fullname).toBe("New Name");
            expect(updated?.username).toBe(user.username);
            const found = await User.findById(user._id).session(session);
            expect(found?.fullname).toBe("New Name");
        });
        await session.endSession();
    });
    it("возвращает null если пользователь не найден", async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const updated = await updateUserUtil({
                userId: fakeId,
                updateData: { fullname: "New Name" },
                session,
            });
            expect(updated).toBeNull();
        });
        await session.endSession();
    });
});
