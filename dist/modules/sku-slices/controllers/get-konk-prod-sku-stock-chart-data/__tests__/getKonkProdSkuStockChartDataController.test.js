import { beforeEach, describe, expect, it, vi } from "vitest";
import { getKonkProdSkuStockChartDataController } from "../getKonkProdSkuStockChartDataController.js";
import { getKonkProdSkuStockChartDataUtil } from "../utils/getKonkProdSkuStockChartDataUtil.js";
vi.mock("../utils/getKonkProdSkuStockChartDataUtil.js");
describe("getKonkProdSkuStockChartDataController", () => {
    let res;
    let responseStatus;
    let responseJson;
    beforeEach(() => {
        vi.clearAllMocks();
        responseStatus = {};
        responseJson = {};
        res = {
            status(code) {
                responseStatus.code = code;
                return this;
            },
            json(data) {
                responseJson = data;
                return this;
            },
        };
    });
    it("400 when validation fails", async () => {
        const req = {
            query: { konk: "", prod: "p", dateFrom: "2026-01-01", dateTo: "2026-01-02" },
        };
        await getKonkProdSkuStockChartDataController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when util returns ok false", async () => {
        vi.mocked(getKonkProdSkuStockChartDataUtil).mockResolvedValue({ ok: false });
        const req = {
            query: {
                konk: "air",
                prod: "gemar",
                dateFrom: "2026-01-01",
                dateTo: "2026-01-02",
            },
        };
        await getKonkProdSkuStockChartDataController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 passes parsed input to util", async () => {
        vi.mocked(getKonkProdSkuStockChartDataUtil).mockResolvedValue({
            ok: true,
            data: {
                days: [],
                summary: {
                    firstDayCompetitorStock: 0,
                    lastDayCompetitorStock: 0,
                    firstDayBtradeStock: 0,
                    lastDayBtradeStock: 0,
                    diffCompetitorStock: 0,
                    diffBtradeStock: 0,
                    diffCompetitorStockPct: null,
                    diffBtradeStockPct: null,
                },
            },
        });
        const req = {
            query: {
                konk: "air",
                prod: "gemar",
                dateFrom: "2026-03-01",
                dateTo: "2026-03-02",
            },
        };
        await getKonkProdSkuStockChartDataController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(getKonkProdSkuStockChartDataUtil).toHaveBeenCalledTimes(1);
        const arg = vi.mocked(getKonkProdSkuStockChartDataUtil).mock.calls[0][0];
        expect(arg.konk).toBe("air");
        expect(arg.prod).toBe("gemar");
        expect(arg.dateFrom.toISOString().slice(0, 10)).toBe("2026-03-01");
    });
});
