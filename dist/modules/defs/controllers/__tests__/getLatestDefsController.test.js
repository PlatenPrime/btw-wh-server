import { beforeEach, describe, expect, it, vi } from "vitest";
import { getLatestDefsController } from "../get-latest-defs/getLatestDefsController.js";
vi.mock("../get-latest-defs/utils/calculateLivePogrebiDefsUtil.js", () => ({
    calculateLivePogrebiDefsUtil: vi.fn(),
}));
vi.mock("../get-latest-defs/utils/enrichDefsWithAsksUtil.js", () => ({
    enrichDefsWithAsksUtil: vi.fn(),
}));
import { calculateLivePogrebiDefsUtil } from "../get-latest-defs/utils/calculateLivePogrebiDefsUtil.js";
import { enrichDefsWithAsksUtil } from "../get-latest-defs/utils/enrichDefsWithAsksUtil.js";
describe("getLatestDefsController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(() => {
        vi.clearAllMocks();
        responseJson = {};
        responseStatus = {};
        res = {
            status: function (code) {
                responseStatus.code = code;
                return this;
            },
            json: function (data) {
                responseJson = data;
                return this;
            },
            headersSent: false,
        };
    });
    it("200: возвращает live-расчёт с calculatedAt", async () => {
        const calculatedAt = new Date("2026-08-04T12:00:00.000Z");
        vi.mocked(calculateLivePogrebiDefsUtil).mockResolvedValue({
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
            calculatedAt,
        });
        vi.mocked(enrichDefsWithAsksUtil).mockResolvedValue({
            ART001: {
                nameukr: "Товар 1",
                quant: 10,
                sharikQuant: 5,
                difQuant: -5,
                defLimit: 30,
                status: "critical",
                existingAsk: null,
            },
        });
        await getLatestDefsController({}, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.exists).toBe(true);
        expect(responseJson.data.total).toBe(1);
        expect(responseJson.data.calculatedAt).toEqual(calculatedAt);
        expect(responseJson.data._id).toBeUndefined();
        expect(responseJson.data.result.ART001.existingAsk).toBeNull();
    });
    it("500 при ошибке расчёта", async () => {
        vi.mocked(calculateLivePogrebiDefsUtil).mockRejectedValue(new Error("boom"));
        await getLatestDefsController({}, res);
        expect(responseStatus.code).toBe(500);
        expect(responseJson.success).toBe(false);
    });
});
