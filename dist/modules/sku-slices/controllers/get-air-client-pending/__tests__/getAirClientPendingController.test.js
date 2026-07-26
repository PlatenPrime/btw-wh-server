import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAirClientPendingController } from "../getAirClientPendingController.js";
vi.mock("../utils/getAirClientPendingUtil.js", () => ({
    getAirClientPendingUtil: vi.fn(),
}));
import { getAirClientPendingUtil } from "../utils/getAirClientPendingUtil.js";
describe("getAirClientPendingController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it("200 returns pending payload", async () => {
        const date = new Date("2026-07-26T00:00:00.000Z");
        vi.mocked(getAirClientPendingUtil).mockResolvedValue({
            date,
            items: [
                {
                    skuId: "s1",
                    productId: "air-1",
                    title: "One",
                    url: "https://airballoons.com.ua/ua/product/1",
                },
            ],
        });
        const req = {};
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
        await getAirClientPendingController(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: "Air client pending retrieved successfully",
            data: {
                date,
                items: [
                    {
                        skuId: "s1",
                        productId: "air-1",
                        title: "One",
                        url: "https://airballoons.com.ua/ua/product/1",
                    },
                ],
            },
        });
    });
});
