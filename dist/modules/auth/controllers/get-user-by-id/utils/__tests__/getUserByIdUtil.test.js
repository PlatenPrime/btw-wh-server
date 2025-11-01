import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../../test/setup.js";
import { getUserByIdUtil } from "../getUserByIdUtil.js";
describe("getUserByIdUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("возвращает пользователя без поля password", async () => {
        const user = await createTestUser({
            username: `testuser-${Date.now()}`,
            fullname: "Test User",
        });
        const result = await getUserByIdUtil(user._id.toString());
        expect(result).toBeTruthy();
        expect(result?._id.toString()).toBe(user._id.toString());
        expect(result.password).toBeUndefined();
        expect(result?.username).toBe(user.username);
    });
    it("возвращает null если пользователь не найден", async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const result = await getUserByIdUtil(fakeId);
        expect(result).toBeNull();
    });
});
