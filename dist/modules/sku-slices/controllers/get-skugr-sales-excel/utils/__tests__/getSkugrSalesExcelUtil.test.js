import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../../skus/models/Sku.js";
import { Skugr } from "../../../../../skugrs/models/Skugr.js";
import { SkuSlice } from "../../../../models/SkuSlice.js";
import { getSkugrSalesExcelUtil } from "../getSkugrSalesExcelUtil.js";
describe("getSkugrSalesExcelUtil", () => {
    beforeEach(async () => {
        await Sku.deleteMany({});
        await Skugr.deleteMany({});
        await SkuSlice.deleteMany({});
    });
    it("returns ok false when skugr not found", async () => {
        const result = await getSkugrSalesExcelUtil({
            skugrId: "507f1f77bcf86cd799439011",
            dateFrom: new Date("2026-08-01T00:00:00.000Z"),
            dateTo: new Date("2026-08-01T00:00:00.000Z"),
        });
        expect(result.ok).toBe(false);
    });
    it("returns excel buffer and filename for skugr with skus", async () => {
        const sku = await Sku.create({
            konkName: "util-gr",
            prodName: "pr",
            productId: "util-gr-1",
            title: "Item",
            url: "https://e.com/u",
        });
        const skugr = await Skugr.create({
            konkName: "util-gr",
            prodName: "pr",
            title: "Grp",
            url: "https://e.com/g",
            isSliced: true,
            skus: [sku._id],
        });
        await SkuSlice.create({
            konkName: "util-gr",
            date: new Date("2026-08-01T00:00:00.000Z"),
            data: { "util-gr-1": { stock: 10, price: 5 } },
        });
        const result = await getSkugrSalesExcelUtil({
            skugrId: skugr._id.toString(),
            dateFrom: new Date("2026-08-01T00:00:00.000Z"),
            dateTo: new Date("2026-08-01T00:00:00.000Z"),
        });
        expect(result.ok).toBe(true);
        if (!result.ok)
            return;
        expect(Buffer.isBuffer(result.buffer)).toBe(true);
        expect(result.buffer.length).toBeGreaterThan(0);
        expect(result.fileName).toContain("sku_sales_skugr_");
        expect(result.fileName.endsWith(".xlsx")).toBe(true);
    });
});
