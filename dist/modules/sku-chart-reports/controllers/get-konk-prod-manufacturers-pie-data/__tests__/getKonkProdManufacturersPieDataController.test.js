import { beforeEach, describe, expect, it, vi } from "vitest";
import { getKonkProdManufacturersPieDataController } from "../getKonkProdManufacturersPieDataController.js";
import { getKonkProdManufacturersPieDataUtil } from "../utils/getKonkProdManufacturersPieDataUtil.js";
vi.mock("../utils/getKonkProdManufacturersPieDataUtil.js");
describe("getKonkProdManufacturersPieDataController", () => {
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
                konk: "k",
                dateFrom: "2026-06-10",
                dateTo: "2026-06-01",
            },
        };
        await getKonkProdManufacturersPieDataController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when util returns ok false", async () => {
        vi.mocked(getKonkProdManufacturersPieDataUtil).mockResolvedValue({
            ok: false,
        });
        const req = {
            query: {
                konk: "k",
                dateFrom: "2026-06-01",
                dateTo: "2026-06-02",
            },
        };
        await getKonkProdManufacturersPieDataController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 returns pie data and all summary", async () => {
        vi.mocked(getKonkProdManufacturersPieDataUtil).mockResolvedValue({
            ok: true,
            data: {
                Acme: { title: "Acme", salesPcs: 3, salesUah: 30 },
            },
            all: { title: "Всі виробники", salesPcs: 3, salesUah: 30 },
        });
        const req = {
            query: {
                konk: "k",
                dateFrom: "2026-06-01",
                dateTo: "2026-06-02",
            },
        };
        await getKonkProdManufacturersPieDataController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data).toBeDefined();
        expect(responseJson.all).toBeDefined();
    });
});
