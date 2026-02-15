import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSharikData } from "../../../comps/utils/getSharikData.js";
import { Del } from "../../models/Del.js";
import { updateDelArtikulByDelIdController } from "../update-del-artikul-by-del-id/updateDelArtikulByDelIdController.js";
vi.mock("../../../comps/utils/getSharikData.js");
describe("updateDelArtikulByDelIdController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        vi.clearAllMocks();
        await Del.deleteMany({});
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
    it("404 when del or product not found", async () => {
        const del = await Del.create({
            title: "Del",
            artikuls: { "ART-1": 0 },
        });
        vi.mocked(getSharikData).mockResolvedValue(null);
        const req = {
            params: { id: del._id.toString(), artikul: "ART-1" },
        };
        await updateDelArtikulByDelIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 updates and returns del", async () => {
        const del = await Del.create({
            title: "Del",
            artikuls: { "ART-1": 0 },
        });
        vi.mocked(getSharikData).mockResolvedValue({
            nameukr: "Товар",
            price: 100,
            quantity: 15,
        });
        const req = {
            params: { id: del._id.toString(), artikul: "ART-1" },
        };
        await updateDelArtikulByDelIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const data = responseJson.data;
        const artikuls = data?.toObject?.()?.artikuls ?? data?.artikuls ?? {};
        expect(artikuls["ART-1"]).toBe(15);
    });
});
