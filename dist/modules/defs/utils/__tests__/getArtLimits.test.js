import { beforeEach, describe, expect, it, vi } from "vitest";
import { getArtLimits } from "../getArtLimits.js";
// Мокаем модель Art
vi.mock("../../../arts/models/Art.js", () => ({
    Art: {
        find: vi.fn(),
    },
}));
import { Art } from "../../../arts/models/Art.js";
describe("getArtLimits", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it("должна возвращать лимиты для найденных артикулов", async () => {
        const mockArts = [
            { artikul: "ART001", limit: 10 },
            { artikul: "ART002", limit: 5 },
            { artikul: "ART003", limit: 15 },
        ];
        const mockFind = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                exec: vi.fn().mockResolvedValue(mockArts),
            }),
        });
        Art.find = mockFind;
        const result = await getArtLimits(["ART001", "ART002", "ART003", "ART004"]);
        expect(mockFind).toHaveBeenCalledWith({
            artikul: { $in: ["ART001", "ART002", "ART003", "ART004"] },
            limit: { $exists: true, $ne: null },
        });
        expect(result).toEqual({
            ART001: 10,
            ART002: 5,
            ART003: 15,
        });
    });
    it("должна возвращать пустой объект если артикулы не найдены", async () => {
        const mockFind = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                exec: vi.fn().mockResolvedValue([]),
            }),
        });
        Art.find = mockFind;
        const result = await getArtLimits(["ART001", "ART002"]);
        expect(result).toEqual({});
    });
    it("должна обрабатывать ошибки и возвращать пустой объект", async () => {
        const mockFind = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                exec: vi.fn().mockRejectedValue(new Error("Database error")),
            }),
        });
        Art.find = mockFind;
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });
        const result = await getArtLimits(["ART001"]);
        expect(result).toEqual({});
        expect(consoleSpy).toHaveBeenCalledWith("Ошибка при получении лимитов из модели Art:", expect.any(Error));
        consoleSpy.mockRestore();
    });
    it("должна фильтровать артикулы с undefined лимитами", async () => {
        const mockArts = [
            { artikul: "ART001", limit: 10 },
            { artikul: "ART002", limit: undefined },
            { artikul: "ART003", limit: null },
        ];
        const mockFind = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                exec: vi.fn().mockResolvedValue(mockArts),
            }),
        });
        Art.find = mockFind;
        const result = await getArtLimits(["ART001", "ART002", "ART003"]);
        expect(result).toEqual({
            ART001: 10,
        });
    });
    it("должна обрабатывать пустой массив артикулов", async () => {
        const mockFind = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                exec: vi.fn().mockResolvedValue([]),
            }),
        });
        Art.find = mockFind;
        const result = await getArtLimits([]);
        expect(mockFind).toHaveBeenCalledWith({
            artikul: { $in: [] },
            limit: { $exists: true, $ne: null },
        });
        expect(result).toEqual({});
    });
});
