import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { createTestArt, createTestUser } from "./setup.js";
describe("Database Tests", () => {
    it("should connect to MongoDB Memory Server", () => {
        expect(mongoose.connection.readyState).toBe(1); // 1 = connected
    });
    it("should create and find a user", async () => {
        const userData = {
            username: "testuser",
            fullname: "Test User",
            password: "password123",
            role: "user",
        };
        const user = await createTestUser(userData);
        expect(user.username).toBe("testuser");
        expect(user.fullname).toBe("Test User");
        expect(user._id).toBeDefined();
    });
    it("should create and find an art", async () => {
        const artData = {
            artikul: "TEST001",
            nameukr: "Test Art",
            namerus: "Тест Арт",
            zone: "A1",
            limit: 100,
        };
        const art = await createTestArt(artData);
        expect(art.artikul).toBe("TEST001");
        expect(art.nameukr).toBe("Test Art");
        expect(art.zone).toBe("A1");
        expect(art._id).toBeDefined();
    });
    it("should clear data between tests", async () => {
        // This test should start with empty collections
        const User = mongoose.model("User");
        const Art = mongoose.model("Art");
        const userCount = await User.countDocuments();
        const artCount = await Art.countDocuments();
        expect(userCount).toBe(0);
        expect(artCount).toBe(0);
    });
});
