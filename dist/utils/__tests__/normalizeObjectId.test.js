import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { normalizeObjectId } from "../normalizeObjectId.js";
describe("normalizeObjectId", () => {
    it("нормализует строку в ObjectId", () => {
        const idString = new mongoose.Types.ObjectId().toString();
        const result = normalizeObjectId(idString);
        expect(result).toBeInstanceOf(mongoose.Types.ObjectId);
        expect(result.toString()).toBe(idString);
    });
    it("возвращает существующий ObjectId без изменений", () => {
        const objectId = new mongoose.Types.ObjectId();
        const result = normalizeObjectId(objectId);
        expect(result).toBe(objectId);
        expect(result).toBeInstanceOf(mongoose.Types.ObjectId);
    });
    it("обрабатывает валидные форматы ObjectId", () => {
        const validId = "507f1f77bcf86cd799439011";
        const result = normalizeObjectId(validId);
        expect(result).toBeInstanceOf(mongoose.Types.ObjectId);
        expect(result.toString()).toBe(validId);
    });
    it("создает новый ObjectId из строки", () => {
        const idString = "507f191e810c19729de860ea";
        const result = normalizeObjectId(idString);
        expect(result).toBeInstanceOf(mongoose.Types.ObjectId);
        expect(result.toString()).toBe(idString);
    });
    it("сохраняет ссылку на тот же ObjectId", () => {
        const objectId = new mongoose.Types.ObjectId();
        const result1 = normalizeObjectId(objectId);
        const result2 = normalizeObjectId(objectId);
        expect(result1).toBe(result2);
        expect(result1).toBe(objectId);
    });
    it("создает разные ObjectId из разных строк", () => {
        const idString1 = "507f1f77bcf86cd799439011";
        const idString2 = "507f191e810c19729de860ea";
        const result1 = normalizeObjectId(idString1);
        const result2 = normalizeObjectId(idString2);
        expect(result1).not.toEqual(result2);
        expect(result1.toString()).toBe(idString1);
        expect(result2.toString()).toBe(idString2);
    });
});
