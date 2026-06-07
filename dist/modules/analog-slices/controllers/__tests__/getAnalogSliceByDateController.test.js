import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAnalogSliceByDateController } from "../get-analog-slice-by-date/getAnalogSliceByDateController.js";
import { getAnalogSliceByDateUtil } from "../get-analog-slice-by-date/utils/getAnalogSliceByDateUtil.js";
vi.mock("../get-analog-slice-by-date/utils/getAnalogSliceByDateUtil.js");
describe("getAnalogSliceByDateController", () => {
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
    it("returns 400 on invalid analogId", async () => {
        const req = {
            params: { analogId: "invalid" },
            query: { date: "2026-03-01" },
        };
        await getAnalogSliceByDateController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseBody?.message).toBe("Validation error");
    });
    it("returns 404 when util returns null", async () => {
        vi.mocked(getAnalogSliceByDateUtil).mockResolvedValue(null);
        const req = {
            params: { analogId: "69a2de17f8a2a9cb9a8a75df" },
            query: { date: "2026-03-01" },
        };
        await getAnalogSliceByDateController(req, res);
        expect(getAnalogSliceByDateUtil).toHaveBeenCalledTimes(1);
        expect(responseStatus.code).toBe(404);
        expect(responseBody).toEqual({
            message: "Analog not found, analog has no artikul, or no slice data for this date",
        });
    });
    it("returns 200 with stock and price on success", async () => {
        vi.mocked(getAnalogSliceByDateUtil).mockResolvedValue({ stock: 5, price: 1.64 });
        const req = {
            params: { analogId: "69a2de17f8a2a9cb9a8a75df" },
            query: { date: "2026-03-01" },
        };
        await getAnalogSliceByDateController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseBody).toEqual({
            message: "Analog slice by date retrieved successfully",
            data: { stock: 5, price: 1.64 },
        });
    });
});
