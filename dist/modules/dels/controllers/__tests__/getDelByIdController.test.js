import { beforeEach, describe, expect, it } from "vitest";
import { Del } from "../../models/Del.js";
import { getDelByIdController } from "../get-del-by-id/getDelByIdController.js";
describe("getDelByIdController", () => {
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
        await getDelByIdController(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Del not found");
    });
    it("400 on invalid id", async () => {
        const req = { params: { id: "invalid" } };
        await getDelByIdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("200 returns full document", async () => {
        const del = await Del.create({
            title: "Full Del",
            artikuls: { "A1": 1 },
        });
        const req = { params: { id: del._id.toString() } };
        await getDelByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.title).toBe("Full Del");
        expect(responseJson.data.artikuls).toBeDefined();
    });
});
