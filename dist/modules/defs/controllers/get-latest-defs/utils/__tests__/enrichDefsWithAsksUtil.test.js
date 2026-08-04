import { beforeEach, describe, expect, it, vi } from "vitest";
import { enrichDefsWithAsksUtil } from "../enrichDefsWithAsksUtil.js";
vi.mock("../../../../../asks/models/Ask.js", () => ({
    Ask: {
        find: vi.fn(),
    },
}));
import { Ask } from "../../../../../asks/models/Ask.js";
describe("enrichDefsWithAsksUtil", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it("обогащает дефициты информацией о заявках", async () => {
        const resultInput = {
            ART001: {
                nameukr: "Товар 1",
                quant: 10,
                sharikQuant: 5,
                difQuant: -5,
                defLimit: 30,
                status: "critical",
            },
            ART002: {
                nameukr: "Товар 2",
                quant: 20,
                sharikQuant: 25,
                difQuant: 5,
                defLimit: 40,
                status: "limited",
            },
        };
        const mockAsks = [
            {
                _id: "ask-id-1",
                artikul: "ART001",
                status: "new",
                createdAt: new Date("2024-01-10T10:00:00.000Z"),
                askerData: {
                    fullname: "Иван Иванов",
                    _id: "user-id-1",
                },
            },
        ];
        const mockFind = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue(mockAsks),
            }),
        });
        Ask.find = mockFind;
        const result = await enrichDefsWithAsksUtil(resultInput);
        expect(mockFind).toHaveBeenCalledWith({
            artikul: { $in: ["ART001", "ART002"] },
            status: { $in: ["new"] },
        });
        expect(result.ART001.existingAsk).not.toBeNull();
        expect(result.ART001.existingAsk?._id).toBe("ask-id-1");
        expect(result.ART001.existingAsk?.askerName).toBe("Иван Иванов");
        expect(result.ART002.existingAsk).toBeNull();
    });
    it("обрабатывает случай когда заявок нет", async () => {
        const resultInput = {
            ART001: {
                nameukr: "Товар 1",
                quant: 10,
                sharikQuant: 5,
                difQuant: -5,
                defLimit: 30,
                status: "critical",
            },
        };
        Ask.find = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue([]),
            }),
        });
        const result = await enrichDefsWithAsksUtil(resultInput);
        expect(result.ART001.existingAsk).toBeNull();
    });
    it("берёт только первую заявку для каждого артикула", async () => {
        const resultInput = {
            ART001: {
                nameukr: "Товар 1",
                quant: 10,
                sharikQuant: 5,
                difQuant: -5,
                defLimit: 30,
                status: "critical",
            },
        };
        const mockAsks = [
            {
                _id: "ask-id-1",
                artikul: "ART001",
                status: "new",
                createdAt: new Date("2024-01-10T10:00:00.000Z"),
                askerData: { fullname: "Иван Иванов", _id: "user-id-1" },
            },
            {
                _id: "ask-id-2",
                artikul: "ART001",
                status: "new",
                createdAt: new Date("2024-01-12T10:00:00.000Z"),
                askerData: { fullname: "Петр Петров", _id: "user-id-2" },
            },
        ];
        Ask.find = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue(mockAsks),
            }),
        });
        const result = await enrichDefsWithAsksUtil(resultInput);
        expect(result.ART001.existingAsk?._id).toBe("ask-id-1");
    });
    it("обрабатывает пустые дефициты", async () => {
        const mockFind = vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue([]),
            }),
        });
        Ask.find = mockFind;
        const result = await enrichDefsWithAsksUtil({});
        expect(result).toEqual({});
        expect(mockFind).toHaveBeenCalledWith({
            artikul: { $in: [] },
            status: { $in: ["new"] },
        });
    });
});
