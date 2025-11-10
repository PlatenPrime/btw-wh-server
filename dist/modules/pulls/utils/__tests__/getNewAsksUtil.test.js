import { describe, expect, it, vi, afterEach } from "vitest";
import { getNewAsksUtil } from "../getNewAsksUtil.js";
import { Ask } from "../../../asks/models/Ask.js";
import { Types } from "mongoose";
const mockFind = (asks) => {
    const lean = vi.fn().mockResolvedValue(asks);
    vi.spyOn(Ask, "find").mockReturnValue({
        lean,
    });
    return lean;
};
const buildAsk = (overrides) => ({
    _id: new Types.ObjectId(),
    artikul: "ART-1",
    asker: new Types.ObjectId(),
    askerData: {
        _id: new Types.ObjectId(),
        fullname: "User",
        telegram: "@user",
        photo: "",
    },
    status: "new",
    actions: [],
    pullQuant: 0,
    pullBox: 0,
    events: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});
describe("getNewAsksUtil", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it("возвращает только заявки требующие дополнительного снятия", async () => {
        const asks = [
            buildAsk({ quant: 10, pullQuant: 0 }), // needs full
            buildAsk({ quant: 5, pullQuant: 5 }), // satisfied
            buildAsk({ quant: 8, pullQuant: 3 }), // needs remainder
            buildAsk({ quant: undefined, pullQuant: 0, pullBox: 0 }), // unspecified demand, no pulls
            buildAsk({ quant: undefined, pullQuant: 1, pullBox: 0 }), // unspecified but already pulled
        ];
        const lean = mockFind(asks);
        const result = await getNewAsksUtil();
        expect(Ask.find).toHaveBeenCalledWith({ status: "new" });
        expect(lean).toHaveBeenCalledTimes(1);
        expect(result).toHaveLength(3);
        expect(result).toEqual([asks[0], asks[2], asks[3]]);
    });
    it("возвращает пустой массив если активных заявок нет", async () => {
        mockFind([]);
        const result = await getNewAsksUtil();
        expect(result).toEqual([]);
    });
});
