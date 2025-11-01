import { describe, expect, it } from "vitest";
import { hashPasswordUtil } from "../hashPasswordUtil.js";
import { comparePasswordUtil } from "../comparePasswordUtil.js";
describe("comparePasswordUtil", () => {
    it("возвращает true для правильного пароля", () => {
        const password = "testPassword123";
        const hash = hashPasswordUtil(password);
        const isValid = comparePasswordUtil(password, hash);
        expect(isValid).toBe(true);
    });
    it("возвращает false для неправильного пароля", () => {
        const correctPassword = "testPassword123";
        const wrongPassword = "wrongPassword";
        const hash = hashPasswordUtil(correctPassword);
        const isValid = comparePasswordUtil(wrongPassword, hash);
        expect(isValid).toBe(false);
    });
    it("работает с паролями, захешированными с разной солью", () => {
        const password = "testPassword123";
        const hash1 = hashPasswordUtil(password);
        const hash2 = hashPasswordUtil(password);
        expect(comparePasswordUtil(password, hash1)).toBe(true);
        expect(comparePasswordUtil(password, hash2)).toBe(true);
    });
});
