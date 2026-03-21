import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnsupportedKonkForGroupProductsError } from "../../../../browser/group-products/fetchGroupProductsByKonkName.js";
import { fillSkugrSkusController } from "../fillSkugrSkusController.js";
vi.mock("../../../utils/fillSkugrSkusFromBrowserUtil.js", () => ({
    fillSkugrSkusFromBrowserUtil: vi.fn(),
}));
import { fillSkugrSkusFromBrowserUtil } from "../../../utils/fillSkugrSkusFromBrowserUtil.js";
const mockFill = vi.mocked(fillSkugrSkusFromBrowserUtil);
describe("fillSkugrSkusController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(() => {
        mockFill.mockReset();
        responseJson = {};
        responseStatus = {};
        res = {
            status(code) {
                responseStatus.code = code;
                return this;
            },
            json(data) {
                responseJson = data;
                return this;
            },
            headersSent: false,
        };
    });
    it("400 on validation error", async () => {
        const req = {
            params: { id: "" },
            body: {},
        };
        await fillSkugrSkusController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when skugr not found", async () => {
        mockFill.mockResolvedValue(null);
        const req = {
            params: { id: "507f1f77bcf86cd799439011" },
            body: {},
        };
        await fillSkugrSkusController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("400 on unsupported konk from util", async () => {
        mockFill.mockRejectedValue(new UnsupportedKonkForGroupProductsError("air"));
        const req = {
            params: { id: "507f1f77bcf86cd799439011" },
            body: {},
        };
        await fillSkugrSkusController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toMatch(/air/);
    });
});
