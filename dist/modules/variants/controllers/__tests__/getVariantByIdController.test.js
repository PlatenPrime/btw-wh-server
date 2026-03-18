import { beforeEach, describe, expect, it } from "vitest";
import { Variant } from "../../models/Variant.js";
import { getVariantByIdController } from "../get-variant-by-id/getVariantByIdController.js";
describe("getVariantByIdController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Variant.deleteMany({});
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
        await getVariantByIdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when variant not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
        };
        await getVariantByIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 returns variant", async () => {
        const variant = await Variant.create({
            konkName: "k",
            prodName: "p",
            title: "Variant X",
            url: "https://x.com/variant-x",
            imageUrl: "https://example.com/x.png",
        });
        const req = {
            params: { id: variant._id.toString() },
        };
        await getVariantByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.title).toBe("Variant X");
    });
});
