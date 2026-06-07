import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAnalogSliceController } from "../get-analog-slice/getAnalogSliceController.js";
import { getAnalogSliceUtil } from "../get-analog-slice/utils/getAnalogSliceUtil.js";
vi.mock("../get-analog-slice/utils/getAnalogSliceUtil.js");
describe("getAnalogSliceController", () => {
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
    it("returns 400 on validation error (missing konkName)", async () => {
        const req = {
            query: { date: "2026-03-01" },
        };
        await getAnalogSliceController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseBody?.message).toBe("Validation error");
    });
    it("returns 404 when util returns null", async () => {
        vi.mocked(getAnalogSliceUtil).mockResolvedValue(null);
        const req = {
            query: { konkName: "air", date: "2026-03-01" },
        };
        await getAnalogSliceController(req, res);
        expect(getAnalogSliceUtil).toHaveBeenCalledTimes(1);
        expect(responseStatus.code).toBe(404);
        expect(responseBody).toEqual({ message: "Analog slice not found" });
    });
    it("returns 200 with slice data on success", async () => {
        const mockData = {
            konkName: "air",
            date: new Date("2026-03-01T00:00:00.000Z"),
            data: { id1: { stock: 10, price: 100 } },
        };
        vi.mocked(getAnalogSliceUtil).mockResolvedValue(mockData);
        const req = {
            query: { konkName: "air", date: "2026-03-01" },
        };
        await getAnalogSliceController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseBody).toEqual({
            message: "Analog slice retrieved successfully",
            data: mockData,
        });
    });
});
