import { describe, expect, it } from "vitest";
import * as controllers from "../index.js";
describe("sku-slices controllers index", () => {
    it("re-exports all controller handlers as functions", () => {
        const expected = [
            "getSkuSliceController",
            "getSkuSliceByDateController",
            "getSkuSliceRangeController",
            "getSkuSalesByDateController",
            "getSkuSalesRangeController",
            "getSkuStockSliceExcelController",
            "getKonkSkuStockSliceExcelController",
            "getSkuSalesExcelController",
            "getKonkSkuSalesExcelController",
            "getKonkProdSkuSalesChartDataController",
            "getKonkProdSkuStockChartDataController",
            "getKonkProdManufacturersPieDataController",
            "getKonkProdSkugrGroupsSalesController",
            "getSkugrDailySummaryController",
            "getSkugrSliceExcelController",
            "getSkugrSalesExcelController",
        ];
        for (const name of expected) {
            expect(typeof controllers[name]).toBe("function");
        }
    });
});
