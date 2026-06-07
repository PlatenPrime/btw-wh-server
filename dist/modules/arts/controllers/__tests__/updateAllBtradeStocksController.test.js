import { beforeEach, describe, expect, it, vi } from "vitest";
import * as updateAllUtil from "../../utils/updateAllBtradeStocksUtil.js";
import { updateAllBtradeStocksController } from "../update-all-btrade-stocks/updateAllBtradeStocksController.js";
describe("updateAllBtradeStocksController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(() => {
        responseJson = {};
        responseStatus = {};
        res = {
            status: function (code) {
                responseStatus.code = code;
                return this;
            },
            json: function (data) {
                responseJson = data;
                return this;
            },
            headersSent: false,
        };
        vi.clearAllMocks();
    });
    it("202: запускает фоновое обновление btradeStock", async () => {
        vi.spyOn(updateAllUtil, "updateAllBtradeStocksUtil").mockResolvedValue({
            total: 2,
            updated: 2,
            errors: 0,
            notFound: 0,
        });
        const req = {};
        await updateAllBtradeStocksController(req, res);
        expect(responseStatus.code).toBe(202);
        expect(responseJson.message).toBe("BtradeStock update process started");
        expect(updateAllUtil.updateAllBtradeStocksUtil).toHaveBeenCalled();
    });
});
