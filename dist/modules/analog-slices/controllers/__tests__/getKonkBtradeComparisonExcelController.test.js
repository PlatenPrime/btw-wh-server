import { beforeEach, describe, expect, it, vi } from "vitest";
import { getKonkBtradeComparisonExcelController } from "../get-konk-btrade-comparison-excel/getKonkBtradeComparisonExcelController.js";
import { getKonkBtradeComparisonRangeUtil } from "../get-konk-btrade-comparison-excel/utils/getKonkBtradeComparisonRangeUtil.js";
import { buildKonkBtradeComparisonExcel } from "../get-konk-btrade-comparison-excel/utils/buildKonkBtradeComparisonExcel.js";
vi.mock("../get-konk-btrade-comparison-excel/utils/getKonkBtradeComparisonRangeUtil.js");
vi.mock("../get-konk-btrade-comparison-excel/utils/buildKonkBtradeComparisonExcel.js");
describe("getKonkBtradeComparisonExcelController", () => {
    let res;
    let responseStatus;
    let responseHeaders;
    let responseBody;
    beforeEach(() => {
        responseStatus = {};
        responseHeaders = {};
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
            send(data) {
                responseBody = data;
                return this;
            },
            setHeader(name, value) {
                responseHeaders[name] = value;
                return this;
            },
        };
        vi.clearAllMocks();
    });
    it("returns 400 on validation error", async () => {
        const req = {
            query: {
                konk: "",
                prod: "gemar",
                dateFrom: "2026-03-10",
                dateTo: "2026-03-01",
            },
        };
        await getKonkBtradeComparisonExcelController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseBody?.message).toBe("Validation error");
    });
    it("returns 404 when no analogs found for konk/prod", async () => {
        vi.mocked(getKonkBtradeComparisonRangeUtil).mockResolvedValue({
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
        await getKonkBtradeComparisonExcelController(req, res);
        expect(getKonkBtradeComparisonRangeUtil).toHaveBeenCalledTimes(1);
        expect(responseStatus.code).toBe(404);
        expect(responseBody).toEqual({
            message: "Analogs not found for provided konk/prod",
        });
    });
    it("returns 200 and Excel buffer on success", async () => {
        vi.mocked(getKonkBtradeComparisonRangeUtil).mockResolvedValue({
            ok: true,
            konk: "air",
            prod: "gemar",
            dateFrom: new Date("2026-03-01T00:00:00.000Z"),
            dateTo: new Date("2026-03-31T00:00:00.000Z"),
            analogs: [
                {
                    analogId: "analog-1",
                    artikul: "1102-0259",
                    artNameUkr: "Тестовий товар",
                    producerName: "Test Producer",
                    competitorTitle: "Test Konk",
                    items: [
                        {
                            date: new Date("2026-03-01T00:00:00.000Z"),
                            analogStock: 1,
                            analogPrice: 1.5,
                            btradeStock: 10,
                            btradePrice: 2.0,
                        },
                    ],
                },
            ],
        });
        const mockBuffer = Buffer.from("excel-data");
        const mockFileName = "konk_btrade_comparison_air_gemar_2026-03-01_2026-03-31.xlsx";
        vi.mocked(buildKonkBtradeComparisonExcel).mockResolvedValue({
            buffer: mockBuffer,
            fileName: mockFileName,
        });
        const req = {
            query: {
                konk: "air",
                prod: "gemar",
                dateFrom: "2026-03-01",
                dateTo: "2026-03-31",
            },
        };
        await getKonkBtradeComparisonExcelController(req, res);
        expect(getKonkBtradeComparisonRangeUtil).toHaveBeenCalledTimes(1);
        expect(buildKonkBtradeComparisonExcel).toHaveBeenCalledTimes(1);
        expect(responseStatus.code).toBe(200);
        expect(responseHeaders["Content-Type"]).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        expect(responseHeaders["Content-Disposition"]).toBe(`attachment; filename="${mockFileName}"`);
        expect(responseBody).toBe(mockBuffer);
    });
});
