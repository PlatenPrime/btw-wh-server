import { beforeEach, describe, expect, it, vi } from "vitest";
import { getKonkBtradeSalesComparisonController } from "../get-konk-btrade-sales-comparison/getKonkBtradeSalesComparisonController.js";
import { getKonkBtradeSalesComparisonUtil } from "../get-konk-btrade-sales-comparison/utils/getKonkBtradeSalesComparisonUtil.js";
vi.mock("../get-konk-btrade-sales-comparison/utils/getKonkBtradeSalesComparisonUtil.js");
describe("getKonkBtradeSalesComparisonController", () => {
    let res;
    let responseStatus;
    let responseBody;
    beforeEach(() => {
        responseStatus = {};
        responseBody = null;
        res = {
            status(code) {
                responseStatus.code = code;
                return this;
            },
            json(data) {
                responseBody = data;
                return this;
            },
        };
        vi.clearAllMocks();
    });
    it("returns 400 on validation error (empty konk)", async () => {
        const req = {
            query: {
                konk: "",
                prod: "gemar",
                dateFrom: "2026-03-01",
                dateTo: "2026-03-10",
            },
        };
        await getKonkBtradeSalesComparisonController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseBody?.message).toBe("Validation error");
    });
    it("returns 400 when dateFrom > dateTo", async () => {
        const req = {
            query: {
                konk: "air",
                prod: "gemar",
                dateFrom: "2026-03-10",
                dateTo: "2026-03-01",
            },
        };
        await getKonkBtradeSalesComparisonController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseBody?.message).toBe("Validation error");
    });
    it("returns 404 when util returns ok: false", async () => {
        vi.mocked(getKonkBtradeSalesComparisonUtil).mockResolvedValue({
            ok: false,
        });
        const req = {
            query: {
                konk: "air",
                prod: "gemar",
                dateFrom: "2026-03-01",
                dateTo: "2026-03-31",
            },
        };
        await getKonkBtradeSalesComparisonController(req, res);
        expect(getKonkBtradeSalesComparisonUtil).toHaveBeenCalledTimes(1);
        expect(responseStatus.code).toBe(404);
        expect(responseBody).toEqual({
            message: "Analogs not found for provided konk/prod",
        });
    });
    it("returns 200 with days and summary on success", async () => {
        const mockData = {
            days: [
                {
                    date: "2026-03-01T00:00:00.000Z",
                    competitorSales: 10,
                    competitorRevenue: 150,
                    btradeSales: 12,
                    btradeRevenue: 240,
                },
                {
                    date: "2026-03-02T00:00:00.000Z",
                    competitorSales: 5,
                    competitorRevenue: 75,
                    btradeSales: 8,
                    btradeRevenue: 160,
                },
            ],
            summary: {
                totalCompetitorSales: 15,
                totalBtradeSales: 20,
                totalCompetitorRevenue: 225,
                totalBtradeRevenue: 400,
                diffSalesPcs: 5,
                diffRevenueUah: 175,
                diffSalesPct: 33.33,
                diffRevenuePct: 77.78,
            },
        };
        vi.mocked(getKonkBtradeSalesComparisonUtil).mockResolvedValue({
            ok: true,
            data: mockData,
        });
        const req = {
            query: {
                konk: "air",
                prod: "gemar",
                dateFrom: "2026-03-01",
                dateTo: "2026-03-02",
            },
        };
        await getKonkBtradeSalesComparisonController(req, res);
        expect(getKonkBtradeSalesComparisonUtil).toHaveBeenCalledTimes(1);
        expect(responseStatus.code).toBe(200);
        expect(responseBody).toEqual({
            message: "Sales comparison data retrieved successfully",
            data: mockData,
        });
    });
});
