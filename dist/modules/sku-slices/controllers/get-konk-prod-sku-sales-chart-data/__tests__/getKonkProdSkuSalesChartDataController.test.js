import { beforeEach, describe, expect, it, vi } from "vitest";
import { getKonkProdSkuSalesChartDataController } from "../getKonkProdSkuSalesChartDataController.js";
import { getKonkProdSkuSalesChartDataUtil } from "../utils/getKonkProdSkuSalesChartDataUtil.js";
vi.mock("../utils/getKonkProdSkuSalesChartDataUtil.js");
describe("getKonkProdSkuSalesChartDataController", () => {
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
    it("400 when dateFrom after dateTo", async () => {
        const req = {
            query: {
                konk: "a",
                prod: "b",
                dateFrom: "2026-02-10",
                dateTo: "2026-02-01",
            },
        };
        await getKonkProdSkuSalesChartDataController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when util returns ok false", async () => {
        vi.mocked(getKonkProdSkuSalesChartDataUtil).mockResolvedValue({ ok: false });
        const req = {
            query: {
                konk: "k",
                prod: "p",
                dateFrom: "2026-04-01",
                dateTo: "2026-04-02",
            },
        };
        await getKonkProdSkuSalesChartDataController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 returns data from util", async () => {
        vi.mocked(getKonkProdSkuSalesChartDataUtil).mockResolvedValue({
            ok: true,
            data: {
                days: [],
                summary: {
                    totalCompetitorSales: 0,
                    totalBtradeSales: 0,
                    totalCompetitorRevenue: 0,
                    totalBtradeRevenue: 0,
                    diffSalesPcs: 0,
                    diffRevenueUah: 0,
                    diffSalesPct: null,
                    diffRevenuePct: null,
                },
            },
        });
        const req = {
            query: {
                konk: "k",
                prod: "p",
                dateFrom: "2026-04-01",
                dateTo: "2026-04-01",
            },
        };
        await getKonkProdSkuSalesChartDataController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data).toBeDefined();
    });
});
