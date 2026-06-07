import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../models/Sku.js";
import { deleteKonkInvalidSkusController } from "../delete-konk-invalid-skus/deleteKonkInvalidSkusController.js";
describe("deleteKonkInvalidSkusController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await Sku.deleteMany({});
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
    it("400 when konkName empty", async () => {
        const req = { params: { konkName: "" } };
        await deleteKonkInvalidSkusController(req, res);
        expect(responseStatus.code).toBe(400);
    });
    it("200 deletes invalid skus for konk", async () => {
        await Sku.create({
            konkName: "air",
            prodName: "p",
            productId: "air-bad",
            title: "Bad",
            url: "https://ex.com/bad",
            isInvalid: true,
        });
        await Sku.create({
            konkName: "air",
            prodName: "p",
            productId: "air-good",
            title: "Good",
            url: "https://ex.com/good",
            isInvalid: false,
        });
        const req = { params: { konkName: "air" } };
        await deleteKonkInvalidSkusController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.deletedCount).toBe(1);
        expect(await Sku.countDocuments({ isInvalid: true })).toBe(0);
    });
});
