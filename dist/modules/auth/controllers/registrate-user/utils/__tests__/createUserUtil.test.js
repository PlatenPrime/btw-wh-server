import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import User from "../../../../models/User.js";
import { createUserUtil } from "../createUserUtil.js";
describe("createUserUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("создаёт пользователя в транзакции и возвращает сохранённый документ", async () => {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const result = await createUserUtil({
                username: `testuser-${Date.now()}`,
                password: "password123",
                fullname: "Test User",
                role: "USER",
                session,
            });
            expect(result).toBeTruthy();
            expect(result._id).toBeDefined();
            expect(result.username).toBeTruthy();
            expect(result.fullname).toBe("Test User");
            expect(result.role).toBe("USER");
            const found = await User.findById(result._id).session(session);
            expect(found).not.toBeNull();
            expect(found?.username).toBe(result.username);
        });
        await session.endSession();
    });
    it("сохраняет опциональные поля", async () => {
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const result = await createUserUtil({
                username: `testuser-${Date.now()}`,
                password: "password123",
                fullname: "Test User",
                role: "USER",
                telegram: "@testuser",
                photo: "photo.jpg",
                session,
            });
            expect(result.telegram).toBe("@testuser");
            expect(result.photo).toBe("photo.jpg");
        });
        await session.endSession();
    });
});
