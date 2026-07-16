import { Types } from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { Event } from "../Event.js";
describe("Event Model", () => {
    beforeEach(async () => {
        await Event.deleteMany({});
    });
    describe("Schema Validation", () => {
        it("should fail without required userId", async () => {
            const event = new Event({
                userData: {
                    _id: new Types.ObjectId(),
                    fullname: "Test User",
                },
                department: "constants",
                description: "Something happened",
            });
            await expect(event.save()).rejects.toThrow();
        });
        it("should fail without required userData", async () => {
            const event = new Event({
                userId: new Types.ObjectId(),
                department: "constants",
                description: "Something happened",
            });
            await expect(event.save()).rejects.toThrow();
        });
        it("should fail without required department", async () => {
            const userId = new Types.ObjectId();
            const event = new Event({
                userId,
                userData: { _id: userId, fullname: "Test User" },
                description: "Something happened",
            });
            await expect(event.save()).rejects.toThrow();
        });
        it("should fail without required description", async () => {
            const userId = new Types.ObjectId();
            const event = new Event({
                userId,
                userData: { _id: userId, fullname: "Test User" },
                department: "constants",
            });
            await expect(event.save()).rejects.toThrow();
        });
        it("should fail when userData.fullname is missing", async () => {
            const userId = new Types.ObjectId();
            const event = new Event({
                userId,
                userData: { _id: userId },
                department: "constants",
                description: "Something happened",
            });
            await expect(event.save()).rejects.toThrow();
        });
        it("should save with all required fields", async () => {
            const userId = new Types.ObjectId();
            const event = new Event({
                userId,
                userData: {
                    _id: userId,
                    fullname: "Test User",
                    telegram: "123",
                    photo: "photo.jpg",
                },
                department: "constants",
                description: "Создана константа config",
            });
            const saved = await event.save();
            expect(saved.userId.equals(userId)).toBe(true);
            expect(saved.userData.fullname).toBe("Test User");
            expect(saved.userData.telegram).toBe("123");
            expect(saved.userData.photo).toBe("photo.jpg");
            expect(saved.department).toBe("constants");
            expect(saved.description).toBe("Создана константа config");
            expect(saved.createdAt).toBeInstanceOf(Date);
            expect(saved.updatedAt).toBeInstanceOf(Date);
        });
        it("should save without optional telegram and photo", async () => {
            const userId = new Types.ObjectId();
            const saved = await Event.create({
                userId,
                userData: { _id: userId, fullname: "Minimal User" },
                department: "poses",
                description: "Updated pose",
            });
            expect(saved.userData.telegram).toBeUndefined();
            expect(saved.userData.photo).toBeUndefined();
        });
    });
});
