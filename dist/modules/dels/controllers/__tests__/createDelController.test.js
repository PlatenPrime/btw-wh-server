import { beforeEach, describe, expect, it } from "vitest";
import { Del } from "../../models/Del.js";
import { createDelController } from "../create-del/createDelController.js";
describe("createDelController", () => {
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
    it("400 when title missing", async () => {
        const req = { body: {} };
        await createDelController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("201 creates del and returns data", async () => {
        const req = {
            body: { title: "New", artikuls: { "ART-1": 10 } },
        };
        await createDelController(req, res);
        expect(responseStatus.code).toBe(201);
        expect(responseJson.data.title).toBe("New");
        const count = await Del.countDocuments();
        expect(count).toBe(1);
    });
});
