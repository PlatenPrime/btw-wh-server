import { Types } from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { EVENT_TYPES, Event } from "../Event.js";
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
                type: "create",
                description: "Something happened",
            });
            await expect(event.save()).rejects.toThrow();
        });
        it("should fail without required userData", async () => {
            const event = new Event({
                userId: new Types.ObjectId(),
                department: "constants",
                type: "create",
                description: "Something happened",
            });
            await expect(event.save()).rejects.toThrow();
        });
        it("should fail without required department", async () => {
            const userId = new Types.ObjectId();
            const event = new Event({
                userId,
                userData: { _id: userId, fullname: "Test User" },
                type: "create",
                description: "Something happened",
            });
            await expect(event.save()).rejects.toThrow();
        });
        it("should fail without required type", async () => {
            const userId = new Types.ObjectId();
            const event = new Event({
                userId,
                userData: { _id: userId, fullname: "Test User" },
                department: "constants",
                description: "Something happened",
            });
            await expect(event.save()).rejects.toThrow();
        });
        it("should fail with invalid type", async () => {
            const userId = new Types.ObjectId();
            const event = new Event({
                userId,
                userData: { _id: userId, fullname: "Test User" },
                department: "constants",
                type: "invalid",
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
                type: "create",
            });
            await expect(event.save()).rejects.toThrow();
        });
        it("should fail when userData.fullname is missing", async () => {
            const userId = new Types.ObjectId();
            const event = new Event({
                userId,
                userData: { _id: userId },
                department: "constants",
                type: "create",
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
                type: "create",
                description: "Создана константа config",
            });
            const saved = await event.save();
            expect(saved.userId.equals(userId)).toBe(true);
            expect(saved.userData.fullname).toBe("Test User");
            expect(saved.userData.telegram).toBe("123");
            expect(saved.userData.photo).toBe("photo.jpg");
            expect(saved.department).toBe("constants");
            expect(saved.type).toBe("create");
            expect(saved.description).toBe("Создана константа config");
            expect(saved.createdAt).toBeInstanceOf(Date);
            expect(saved.updatedAt).toBeInstanceOf(Date);
        });
        it.each(EVENT_TYPES)("should accept type=%s", async (type) => {
            const userId = new Types.ObjectId();
            const saved = await Event.create({
                userId,
                userData: { _id: userId, fullname: "Test User" },
                department: "constants",
                type,
                description: `Type ${type}`,
            });
            expect(saved.type).toBe(type);
        });
        it("should save without optional telegram and photo", async () => {
            const userId = new Types.ObjectId();
            const saved = await Event.create({
                userId,
                userData: { _id: userId, fullname: "Minimal User" },
                department: "poses",
                type: "edit",
                description: "Updated pose",
            });
            expect(saved.userData.telegram).toBeUndefined();
            expect(saved.userData.photo).toBeUndefined();
        });
    });
});
