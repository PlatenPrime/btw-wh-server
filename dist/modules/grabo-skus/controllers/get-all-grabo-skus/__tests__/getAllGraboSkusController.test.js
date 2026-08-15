import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GraboSku } from "../../../models/GraboSku.js";
import { getAllGraboSkusController } from "../getAllGraboSkusController.js";
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
describe("getAllGraboSkusController", () => {
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
    it("400 for invalid query", async () => {
        const req = { query: { page: "-1" } };
        await getAllGraboSkusController(req, res);
        expect(responseStatus.code).toBe(400);
        expect(responseJson.message).toBe("Invalid query parameters");
    });
    it("200 returns data and pagination without filterOptions", async () => {
        await GraboSku.create(graboSkuDoc({ productId: "G1", color: "Pink" }));
        const req = { query: {} };
        await getAllGraboSkusController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Grabo skus retrieved successfully");
        expect(Array.isArray(responseJson.data)).toBe(true);
        expect(responseJson.data.length).toBe(1);
        expect(responseJson.pagination).toMatchObject({
            page: 1,
            limit: 10,
            total: 1,
        });
        expect(responseJson).not.toHaveProperty("filterOptions");
    });
    it("200 includes filterOptions when flag is true", async () => {
        await GraboSku.create(graboSkuDoc({ productId: "G1", color: "Pink" }));
        const req = {
            query: { includeFilterOptions: "true" },
        };
        await getAllGraboSkusController(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.filterOptions).toEqual(expect.objectContaining({
            color: ["Pink"],
        }));
    });
    it("500 when listing fails", async () => {
        vi.spyOn(GraboSku, "find").mockImplementation(() => {
            throw new Error("db down");
        });
        const req = { query: {} };
        await getAllGraboSkusController(req, res);
        expect(responseStatus.code).toBe(500);
        expect(responseJson.message).toBe("Server error");
    });
    it("does not send 500 if headers already sent", async () => {
        vi.spyOn(GraboSku, "find").mockImplementation(() => {
            throw new Error("db down");
        });
        res.headersSent = true;
        const req = { query: {} };
        await getAllGraboSkusController(req, res);
        expect(responseStatus.code).toBeUndefined();
    });
});
