import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../skus/models/Sku.js";
import { Skugr } from "../../../../skugrs/models/Skugr.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { getSkugrSalesExcelController } from "../getSkugrSalesExcelController.js";
describe("getSkugrSalesExcelController", () => {
    let res;
    let responseStatus;
    let responseHeaders;
    let responseBody;
    beforeEach(async () => {
        await Sku.deleteMany({});
        await Skugr.deleteMany({});
        await SkuSlice.deleteMany({});
        responseStatus = {};
        responseHeaders = {};
        responseBody = null;
        res = {
            status(code) {
                responseStatus.code = code;
                return this;
            },
            json() {
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
            headersSent: false,
        };
    });
    it("200 sends sales excel buffer", async () => {
        const sku = await Sku.create({
            konkName: "sale-gr",
            prodName: "pr",
            productId: "sale-gr-1",
            title: "Item",
            url: "https://e.com/s",
        });
        const skugr = await Skugr.create({
            konkName: "sale-gr",
            prodName: "pr",
            title: "Grp",
            url: "https://e.com/g",
            isSliced: true,
            skus: [sku._id],
        });
        await SkuSlice.create({
            konkName: "sale-gr",
            date: new Date("2026-08-01T00:00:00.000Z"),
            data: { "sale-gr-1": { stock: 4, price: 10 } },
        });
        const req = {
            params: { skugrId: skugr._id.toString() },
            query: { dateFrom: "2026-08-01", dateTo: "2026-08-01" },
        };
        await getSkugrSalesExcelController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(Buffer.isBuffer(responseBody)).toBe(true);
        expect(responseBody.length).toBeGreaterThan(0);
    });
});
