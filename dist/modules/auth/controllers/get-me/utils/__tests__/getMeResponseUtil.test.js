import { describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../../test/setup.js";
import { getMeResponseUtil } from "../getMeResponseUtil.js";
describe("getMeResponseUtil", () => {
    it("формирует ответ с пользователем без пароля и токеном", async () => {
        const user = await createTestUser({
            username: `testuser-${Date.now()}`,
            fullname: "Test User",
            role: "ADMIN",
        });
        const response = getMeResponseUtil({ user });
        expect(response).toBeTruthy();
        expect(response.user).toBeTruthy();
        expect(response.user.password).toBeUndefined();
        expect(response.user._id.toString()).toBe(user._id.toString());
        expect(response.token).toBeTruthy();
        expect(typeof response.token).toBe("string");
    });
});
