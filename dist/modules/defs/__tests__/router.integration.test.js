import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import app from "../../../test/utils/testApp.js";
vi.mock("../controllers/get-latest-defs/utils/calculateLivePogrebiDefsUtil.js", () => ({
    calculateLivePogrebiDefsUtil: vi.fn(),
}));
import { calculateLivePogrebiDefsUtil } from "../controllers/get-latest-defs/utils/calculateLivePogrebiDefsUtil.js";
const createAuthHeader = (role = RoleType.USER) => {
    const secret = process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
    const token = jwt.sign({ id: new mongoose.Types.ObjectId().toString(), role }, secret, { expiresIn: "1h" });
    return { Authorization: `Bearer ${token}` };
};
describe("Defs router integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(calculateLivePogrebiDefsUtil).mockResolvedValue({
            result: {},
            total: 0,
            totalCriticalDefs: 0,
            totalLimitDefs: 0,
            calculatedAt: new Date("2026-08-04T12:00:00.000Z"),
        });
    });
    describe("GET /api/defs/latest", () => {
        it("401 without auth token", async () => {
            await request(app).get("/api/defs/latest").expect(401);
        });
        it("200 returns live defs for USER", async () => {
            vi.mocked(calculateLivePogrebiDefsUtil).mockResolvedValue({
                result: {
                    ART001: {
                        nameukr: "Товар",
                        quant: 10,
                        sharikQuant: 5,
                        difQuant: -5,
                        defLimit: 30,
                        status: "critical",
                    },
                },
                total: 1,
                totalCriticalDefs: 1,
                totalLimitDefs: 0,
                calculatedAt: new Date("2026-08-04T12:00:00.000Z"),
            });
            const response = await request(app)
                .get("/api/defs/latest")
                .set(createAuthHeader(RoleType.USER))
                .expect(200);
            expect(response.body.exists).toBe(true);
            expect(response.body.data.total).toBe(1);
            expect(response.body.data.calculatedAt).toBeDefined();
            expect(response.body.data._id).toBeUndefined();
        });
        it("404 for removed calculation-status", async () => {
            await request(app)
                .get("/api/defs/calculation-status")
                .set(createAuthHeader(RoleType.USER))
                .expect(404);
        });
        it("404 for removed calculate", async () => {
            await request(app)
                .post("/api/defs/calculate")
                .set(createAuthHeader(RoleType.ADMIN))
                .expect(404);
        });
    });
});
