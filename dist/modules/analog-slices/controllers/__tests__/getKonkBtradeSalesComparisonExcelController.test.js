import { beforeEach, describe, expect, it, vi } from "vitest";
import { getKonkBtradeSalesComparisonExcelController } from "../get-konk-btrade-sales-comparison-excel/getKonkBtradeSalesComparisonExcelController.js";
import { getKonkBtradeComparisonRangeUtil } from "../get-konk-btrade-comparison-excel/utils/getKonkBtradeComparisonRangeUtil.js";
import { buildSalesComparisonExcel } from "../get-konk-btrade-sales-comparison-excel/utils/buildSalesComparisonExcel.js";
vi.mock("../get-konk-btrade-comparison-excel/utils/getKonkBtradeComparisonRangeUtil.js");
vi.mock("../get-konk-btrade-sales-comparison-excel/utils/buildSalesComparisonExcel.js");
describe("getKonkBtradeSalesComparisonExcelController", () => {
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
    it("returns 400 on validation error (empty konk)", async () => {
        const req = {
            query: {
                konk: "",
                prod: "gemar",
                dateFrom: "2026-03-01",
                dateTo: "2026-03-10",
            },
        };
        await getKonkBtradeSalesComparisonExcelController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseBody?.message).toBe("Validation error");
    });
    it("returns 404 when no analogs for konk/prod", async () => {
        vi.mocked(getKonkBtradeComparisonRangeUtil).mockResolvedValue({ ok: false });
        const req = {
            query: {
                konk: "air",
                prod: "gemar",
                dateFrom: "2026-03-01",
                dateTo: "2026-03-31",
            },
        };
        await getKonkBtradeSalesComparisonExcelController(req, res);
        expect(getKonkBtradeComparisonRangeUtil).toHaveBeenCalledTimes(1);
        expect(responseStatus.code).toBe(404);
        expect(responseBody).toEqual({
            message: "Analogs not found for provided konk/prod",
        });
    });
    it("returns 200 and Excel buffer on success", async () => {
        vi.mocked(getKonkBtradeComparisonRangeUtil).mockResolvedValue({
            ok: true,
            analogs: [],
            konk: "air",
            prod: "gemar",
            dateFrom: new Date("2026-03-01T00:00:00.000Z"),
            dateTo: new Date("2026-03-31T00:00:00.000Z"),
            recountDays: [],
        });
        const buffer = Buffer.from("excel-data");
        vi.mocked(buildSalesComparisonExcel).mockResolvedValue({
            buffer,
            fileName: "sales_comparison_air_gemar_2026-03-01_2026-03-31.xlsx",
        });
        const req = {
            query: {
                konk: "air",
                prod: "gemar",
                dateFrom: "2026-03-01",
                dateTo: "2026-03-31",
            },
        };
        await getKonkBtradeSalesComparisonExcelController(req, res);
        expect(buildSalesComparisonExcel).toHaveBeenCalledTimes(1);
        expect(responseStatus.code).toBe(200);
        expect(responseBody).toBe(buffer);
        expect(responseHeaders["Content-Type"]).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    });
});
