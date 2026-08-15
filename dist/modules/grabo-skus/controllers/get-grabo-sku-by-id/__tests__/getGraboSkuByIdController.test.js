import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GraboSku } from "../../../models/GraboSku.js";
import { getGraboSkuByIdController } from "../getGraboSkuByIdController.js";
function graboSkuDoc(overrides = {}) {
    const productId = overrides.productId ?? "G00001";
    return {
        title: "Title",
        productId,
        url: `https://www.grabo-balloons.com/en/${productId.toLowerCase()}`,
        lastSeenAt: new Date("2026-08-15T00:00:00.000Z"),
        ...overrides,
    };
}
describe("getGraboSkuByIdController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(async () => {
        await GraboSku.deleteMany({});
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
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it("400 for invalid id", async () => {
        const req = { params: { id: "bad-id" } };
        await getGraboSkuByIdController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Validation error");
    });
    it("404 when grabo sku is missing", async () => {
        const req = {
            params: { id: "000000000000000000000000" },
        };
        await getGraboSkuByIdController(req, res);
        expect(responseStatus.code).toBe(404);
        expect(responseJson.message).toBe("Grabo sku not found");
    });
    it("200 returns the document", async () => {
        const saved = await GraboSku.create(graboSkuDoc({ productId: "G72274", title: "Pink Ribbon" }));
        const req = { params: { id: saved._id.toString() } };
        await getGraboSkuByIdController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Grabo sku retrieved successfully");
        expect(responseJson.data.productId).toBe("G72274");
    });
    it("500 when lookup fails", async () => {
        vi.spyOn(GraboSku, "findById").mockImplementation(() => {
            throw new Error("db down");
        });
        const req = {
            params: { id: "000000000000000000000000" },
        };
        await getGraboSkuByIdController(req, res);
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
    });
    it("does not send 500 if headers already sent", async () => {
        vi.spyOn(GraboSku, "findById").mockImplementation(() => {
            throw new Error("db down");
        });
        res.headersSent = true;
        const req = {
            params: { id: "000000000000000000000000" },
        };
        await getGraboSkuByIdController(req, res);
        expect(responseStatus.code).toBeUndefined();
    });
});
