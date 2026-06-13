import { describe, expect, it } from "vitest";
import { konkProdRangeSchema } from "../../../../../sku-reporting/schemas/konkProdRangeSchema.js";
import { getKonkProdSkuSalesChartDataSchema } from "../getKonkProdSkuSalesChartDataSchema.js";
describe("getKonkProdSkuSalesChartDataSchema", () => {
    it("re-exports konkProdRangeSchema", () => {
        expect(getKonkProdSkuSalesChartDataSchema).toBe(konkProdRangeSchema);
    });
    it("validates konk/prod date range input", () => {
        const result = getKonkProdSkuSalesChartDataSchema.safeParse({
            konk: "k",
            prod: "p",
            dateFrom: "2026-07-01",
            dateTo: "2026-07-02",
        });
        expect(result.success).toBe(true);
    });
});
