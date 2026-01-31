import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../../test/setup.js";
import { checkUsernameAvailableForUpdateUtil } from "../checkUsernameAvailableForUpdateUtil.js";
describe("checkUsernameAvailableForUpdateUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("возвращает true если username свободен", async () => {
        const user = await createTestUser({ username: `user1-${Date.now()}` });
        const available = await checkUsernameAvailableForUpdateUtil(user._id.toString(), "nonexistent-username");
        expect(available).toBe(true);
    });
    it("возвращает true если username совпадает с текущим пользователем", async () => {
        const user = await createTestUser({ username: `myuser-${Date.now()}` });
        const available = await checkUsernameAvailableForUpdateUtil(user._id.toString(), user.username);
        expect(available).toBe(true);
    });
    it("возвращает false если username занят другим пользователем", async () => {
        const user1 = await createTestUser({ username: `user1-${Date.now()}` });
        const user2 = await createTestUser({ username: `user2-${Date.now()}` });
        const available = await checkUsernameAvailableForUpdateUtil(user1._id.toString(), user2.username);
        expect(available).toBe(false);
    });
});
