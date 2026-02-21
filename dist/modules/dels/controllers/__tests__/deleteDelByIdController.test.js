import { beforeEach, describe, expect, it } from "vitest";
import { Del } from "../../models/Del.js";
import { deleteDelByIdController } from "../delete-del-by-id/deleteDelByIdController.js";
describe("deleteDelByIdController", () => {
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
        await deleteDelByIdController(req, res);
        expect(responseStatus.code).toBe(404);
    });
    it("200 deletes del", async () => {
        const del = await Del.create({
            title: "To delete",
            prodName: "prod1",
            prod: { title: "P1", imageUrl: "https://example.com/p1.png" },
            artikuls: {},
        });
        const req = { params: { id: del._id.toString() } };
        await deleteDelByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        const found = await Del.findById(del._id);
        expect(found).toBeNull();
    });
});
