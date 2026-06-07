import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAnalogSalesByDateController } from "../get-analog-sales-by-date/getAnalogSalesByDateController.js";
import { getAnalogSalesByDateUtil } from "../get-analog-sales-by-date/utils/getAnalogSalesByDateUtil.js";
vi.mock("../get-analog-sales-by-date/utils/getAnalogSalesByDateUtil.js");
describe("getAnalogSalesByDateController", () => {
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
    it("returns 400 on missing date", async () => {
        const req = {
            params: { analogId: "69a2de17f8a2a9cb9a8a75df" },
            query: {},
        };
        await getAnalogSalesByDateController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseBody?.message).toBe("Validation error");
    });
    it("returns 404 when util returns null", async () => {
        vi.mocked(getAnalogSalesByDateUtil).mockResolvedValue(null);
        const req = {
            params: { analogId: "69a2de17f8a2a9cb9a8a75df" },
            query: { date: "2026-03-01" },
        };
        await getAnalogSalesByDateController(req, res);
        expect(getAnalogSalesByDateUtil).toHaveBeenCalledTimes(1);
        expect(responseStatus.code).toBe(404);
        expect(responseBody).toEqual({
            message: "Analog not found, analog has no artikul, or no slice data for this date",
        });
    });
    it("returns 200 with sales data on success", async () => {
        const mockData = {
            sales: 10,
            revenue: 150,
            price: 15,
            isDeliveryDay: false,
        };
        vi.mocked(getAnalogSalesByDateUtil).mockResolvedValue(mockData);
        const req = {
            params: { analogId: "69a2de17f8a2a9cb9a8a75df" },
            query: { date: "2026-03-01" },
        };
        await getAnalogSalesByDateController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseBody).toEqual({
            message: "Analog sales by date retrieved successfully",
            data: mockData,
        });
    });
});
