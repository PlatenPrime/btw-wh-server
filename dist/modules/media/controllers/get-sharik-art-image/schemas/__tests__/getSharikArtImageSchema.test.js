import { describe, expect, it } from "vitest";
import { getSharikArtImageSchema } from "../getSharikArtImageSchema.js";
describe("getSharikArtImageSchema", () => {
    it("принимает валидный artikul и default size=prev", () => {
        const result = getSharikArtImageSchema.safeParse({
            artikul: "1302-0065",
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toEqual({ artikul: "1302-0065", size: "prev" });
        }
    });
    it("trim artikul", () => {
        const result = getSharikArtImageSchema.safeParse({
            artikul: "  1302-0065  ",
            size: "big",
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.artikul).toBe("1302-0065");
            expect(result.data.size).toBe("big");
        }
    });
    it("отклоняет пустой artikul", () => {
        expect(getSharikArtImageSchema.safeParse({ artikul: "  " }).success).toBe(false);
    });
    it("отклоняет artikul длиннее 64", () => {
        expect(getSharikArtImageSchema.safeParse({ artikul: "a".repeat(65) }).success).toBe(false);
    });
    it("отклоняет / \\ и ..", () => {
        expect(getSharikArtImageSchema.safeParse({ artikul: "a/b" }).success).toBe(false);
        expect(getSharikArtImageSchema.safeParse({ artikul: "a\\b" }).success).toBe(false);
        expect(getSharikArtImageSchema.safeParse({ artikul: "a..b" }).success).toBe(false);
    });
    it("отклоняет невалидный size", () => {
        expect(getSharikArtImageSchema.safeParse({
            artikul: "1302-0065",
            size: "huge",
        }).success).toBe(false);
    });
});
