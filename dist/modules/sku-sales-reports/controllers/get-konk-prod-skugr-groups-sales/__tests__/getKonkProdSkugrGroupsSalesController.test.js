import { beforeEach, describe, expect, it, vi } from "vitest";
import { getKonkProdSkugrGroupsSalesController } from "../getKonkProdSkugrGroupsSalesController.js";
import { getKonkProdSkugrGroupsSalesUtil } from "../utils/getKonkProdSkugrGroupsSalesUtil.js";
vi.mock("../utils/getKonkProdSkugrGroupsSalesUtil.js");
describe("getKonkProdSkugrGroupsSalesController", () => {
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
        await getKonkProdSkugrGroupsSalesController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when util returns ok false", async () => {
        vi.mocked(getKonkProdSkugrGroupsSalesUtil).mockResolvedValue({ ok: false });
        const req = {
            query: {
                konk: "k",
                prod: "p",
                dateFrom: "2026-04-01",
                dateTo: "2026-04-02",
            },
        };
        await getKonkProdSkugrGroupsSalesController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 returns data array from util", async () => {
        vi.mocked(getKonkProdSkugrGroupsSalesUtil).mockResolvedValue({
            ok: true,
            data: [
                {
                    skugrId: "507f1f77bcf86cd799439011",
                    title: "G1",
                    salesPcs: 3,
                    salesUah: 12.5,
                },
            ],
            all: {
                title: "Всі групи",
                salesPcs: 3,
                salesUah: 12.5,
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
        await getKonkProdSkugrGroupsSalesController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data).toEqual([
            {
                skugrId: "507f1f77bcf86cd799439011",
                title: "G1",
                salesPcs: 3,
                salesUah: 12.5,
            },
        ]);
        expect(responseJson.all).toEqual({
            title: "Всі групи",
            salesPcs: 3,
            salesUah: 12.5,
        });
    });
});
