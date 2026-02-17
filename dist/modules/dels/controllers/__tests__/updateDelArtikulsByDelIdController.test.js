import { beforeEach, describe, expect, it } from "vitest";
import { Del } from "../../models/Del.js";
import { updateDelArtikulsByDelIdController } from "../update-del-artikuls-by-del-id/updateDelArtikulsByDelIdController.js";
describe("updateDelArtikulsByDelIdController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
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
    it("404 when del not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
        };
        await updateDelArtikulsByDelIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("202 when del found and process started", async () => {
        const del = await Del.create({
            title: "Del",
            artikuls: { A1: { quantity: 0 } },
        });
        const req = { params: { id: del._id.toString() } };
        await updateDelArtikulsByDelIdController(req, res);
        expect(responseStatus.code).toBe(202);
        expect(responseJson.message).toContain("started");
    });
});
