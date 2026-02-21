import { beforeEach, describe, expect, it } from "vitest";
import { Prod } from "../../models/Prod.js";
import { createProdController } from "../create-prod/createProdController.js";
describe("createProdController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
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
    it("400 when name missing", async () => {
        const req = {
            body: { title: "Title", imageUrl: "https://x.com/1.png" },
        };
        await createProdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("201 creates prod and returns data", async () => {
        const req = {
            body: {
                name: "acme",
                title: "Acme Corp",
                imageUrl: "https://example.com/acme.png",
            },
        };
        await createProdController(req, res);
        expect(responseStatus.code).toBe(201);
        expect(responseJson.data.name).toBe("acme");
        const count = await Prod.countDocuments();
        expect(count).toBe(1);
    });
});
