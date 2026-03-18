import { beforeEach, describe, expect, it } from "vitest";
import { Variant } from "../../models/Variant.js";
import { updateVariantByIdController } from "../update-variant-by-id/updateVariantByIdController.js";
describe("updateVariantByIdController", () => {
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
        const req = {
            params: { id: "invalid" },
            body: { title: "New" },
        };
        await updateVariantByIdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("400 when body empty", async () => {
        const variant = await Variant.create({
            konkName: "k",
            prodName: "p",
            title: "Old",
            url: "https://x.com",
            imageUrl: "https://example.com/old.png",
        });
        const req = {
            params: { id: variant._id.toString() },
            body: {},
        };
        await updateVariantByIdController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("404 when variant not found", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
            body: { title: "New" },
        };
        await updateVariantByIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 updates variant", async () => {
        const variant = await Variant.create({
            konkName: "k",
            prodName: "p",
            title: "Old title",
            url: "https://x.com",
            imageUrl: "https://example.com/old.png",
        });
        const req = {
            params: { id: variant._id.toString() },
            body: { title: "New title" },
        };
        await updateVariantByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.title).toBe("New title");
    });
});
