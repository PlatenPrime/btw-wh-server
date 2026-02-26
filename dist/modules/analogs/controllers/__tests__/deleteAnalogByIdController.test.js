import { beforeEach, describe, expect, it } from "vitest";
import { Analog } from "../../models/Analog.js";
import { deleteAnalogByIdController } from "../delete-analog-by-id/deleteAnalogByIdController.js";
describe("deleteAnalogByIdController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Analog.deleteMany({});
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
    it("400 when id invalid", async () => {
        const req = { params: { id: "invalid" } };
        await deleteAnalogByIdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when analog not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
        };
        await deleteAnalogByIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 deletes analog", async () => {
        const analog = await Analog.create({
            konkName: "k",
            prodName: "p",
            url: "https://x.com",
        });
        const req = { params: { id: analog._id.toString() } };
        await deleteAnalogByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const found = await Analog.findById(analog._id);
        expect(found).toBeNull();
    });
});
