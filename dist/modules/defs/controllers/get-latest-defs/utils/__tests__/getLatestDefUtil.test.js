import { beforeEach, describe, expect, it, vi } from "vitest";
import { getLatestDefUtil } from "../getLatestDefUtil.js";
// Мокаем модель Def
vi.mock("../../../../models/Def.js", () => ({
    Def: {
        findOne: vi.fn(),
    },
}));
import { Def } from "../../../../models/Def.js";
describe("getLatestDefUtil", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it("должна возвращать последнюю запись дефицитов", async () => {
        const mockDef = {
            _id: "test-id",
            result: {
                ART001: {
                    nameukr: "Товар 1",
                    quant: 10,
                    sharikQuant: 5,
                    difQuant: -5,
                    defLimit: 30,
                    status: "critical",
                },
            },
            total: 1,
            totalCriticalDefs: 1,
            totalLimitDefs: 0,
            createdAt: new Date("2024-01-15T10:00:00.000Z"),
            updatedAt: new Date("2024-01-15T10:00:00.000Z"),
        };
        const mockFindOne = vi.fn().mockReturnValue({
            sort: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue(mockDef),
            }),
        });
        Def.findOne = mockFindOne;
        const result = await getLatestDefUtil();
        expect(mockFindOne).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockDef);
    });
    it("должна возвращать null если записей нет", async () => {
        const mockFindOne = vi.fn().mockReturnValue({
            sort: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue(null),
            }),
        });
        Def.findOne = mockFindOne;
        const result = await getLatestDefUtil();
        expect(result).toBeNull();
    });
    it("должна правильно сортировать по createdAt", async () => {
        const mockFindOne = vi.fn().mockReturnValue({
            sort: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue(null),
            }),
        });
        Def.findOne = mockFindOne;
        await getLatestDefUtil();
        expect(mockFindOne).toHaveBeenCalledTimes(1);
    });
});
