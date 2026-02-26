import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../../konks/models/Konk.js";
import { Prod } from "../../../prods/models/Prod.js";
import { Analog } from "../../models/Analog.js";
import { getAnalogByIdController } from "../get-analog-by-id/getAnalogByIdController.js";
describe("getAnalogByIdController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Analog.deleteMany({});
        await Konk.deleteMany({});
        await Prod.deleteMany({});
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
        await getAnalogByIdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when analog not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
        };
        await getAnalogByIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 returns analog with konk and prod", async () => {
        await Konk.create({
            name: "acme",
            title: "Acme",
            url: "https://acme.com",
            imageUrl: "https://acme.com/1.png",
        });
        await Prod.create({
            name: "maker",
            title: "Maker",
            imageUrl: "https://maker.com/1.png",
        });
        const analog = await Analog.create({
            konkName: "acme",
            prodName: "maker",
            url: "https://example.com/p",
        });
        const req = { params: { id: analog._id.toString() } };
        await getAnalogByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const data = responseJson.data;
        expect(data.konk.name).toBe("acme");
        expect(data.prod.name).toBe("maker");
    });
});
