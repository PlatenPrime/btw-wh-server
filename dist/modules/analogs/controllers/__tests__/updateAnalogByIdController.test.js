import { beforeEach, describe, expect, it } from "vitest";
import { Analog } from "../../models/Analog.js";
import { updateAnalogByIdController } from "../update-analog-by-id/updateAnalogByIdController.js";
describe("updateAnalogByIdController", () => {
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
        const req = {
            params: { id: "invalid" },
            body: { title: "New" },
        };
        await updateAnalogByIdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("400 when body empty", async () => {
        const analog = await Analog.create({
            konkName: "k",
            prodName: "p",
            url: "https://x.com",
        });
        const req = {
            params: { id: analog._id.toString() },
            body: {},
        };
        await updateAnalogByIdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when analog not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
            body: { nameukr: "New" },
        };
        await updateAnalogByIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 updates analog", async () => {
        const analog = await Analog.create({
            konkName: "k",
            prodName: "p",
            url: "https://x.com",
            nameukr: "Old",
        });
        const req = {
            params: { id: analog._id.toString() },
            body: { nameukr: "New name" },
        };
        await updateAnalogByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.nameukr).toBe("New name");
    });
});
