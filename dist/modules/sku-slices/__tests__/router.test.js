import { describe, expect, it } from "vitest";
import router from "../router.js";
describe("sku-slices router", () => {
    it("registers expected GET routes", () => {
        const paths = router.stack
            .filter((layer) => layer.route)
            .map((layer) => layer.route.path);
        expect(paths).toContain("/");
        expect(paths).toContain("/konk/excel");
        expect(paths).toContain("/konk/sales-excel");
        expect(paths).toContain("/konk-prod/manufacturers-pie-data");
        expect(paths).toContain("/konk-prod/skugr-groups-sales");
        expect(paths).toContain("/konk-prod/stock-chart-data");
        expect(paths).toContain("/konk-prod/sales-chart-data");
        expect(paths).toContain("/skugr/:skugrId/daily-summary");
        expect(paths).toContain("/skugr/:skugrId/slice-excel");
        expect(paths).toContain("/skugr/:skugrId/sales-excel");
        expect(paths).toContain("/sku/:skuId/range");
        expect(paths).toContain("/sku/:skuId/sales-range");
        expect(paths).toContain("/sku/:skuId/sales-by-date");
        expect(paths).toContain("/sku/:skuId/slice-excel");
        expect(paths).toContain("/sku/:skuId/sales-excel");
        expect(paths).toContain("/sku/:skuId");
    });
});
