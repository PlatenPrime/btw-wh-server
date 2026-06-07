import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import "../../../test/setup.js";
import app from "../../../test/utils/testApp.js";
import { BtradeSlice } from "../models/BtradeSlice.js";
const createAuthHeader = (role = RoleType.ADMIN) => {
    const secret = process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
    const token = jwt.sign({ id: new mongoose.Types.ObjectId().toString(), role }, secret, { expiresIn: "1h" });
    return { Authorization: `Bearer ${token}` };
};
describe("Btrade slices router integration", () => {
    describe("GET /api/btrade-slices", () => {
        it("401 without auth token", async () => {
            await request(app)
                .get("/api/btrade-slices")
                .query({ date: "2025-03-01" })
                .expect(401);
        });
        it("403 for USER role", async () => {
            await request(app)
                .get("/api/btrade-slices")
                .set(createAuthHeader(RoleType.USER))
                .query({ date: "2025-03-01" })
                .expect(403);
        });
        it("400 for invalid date format", async () => {
            await request(app)
                .get("/api/btrade-slices")
                .set(createAuthHeader(RoleType.ADMIN))
                .query({ date: "01-03-2025" })
                .expect(400);
        });
        it("404 when slice not found", async () => {
            const response = await request(app)
                .get("/api/btrade-slices")
                .set(createAuthHeader(RoleType.ADMIN))
                .query({ date: "2025-03-01" })
                .expect(404);
            expect(response.body.message).toBe("Btrade slice not found");
        });
        it("200 returns slice for ADMIN", async () => {
            const date = new Date("2025-03-01T00:00:00.000Z");
            await BtradeSlice.create({
                date,
                data: { "ART-1": { price: 100, quantity: 5 } },
            });
            const response = await request(app)
                .get("/api/btrade-slices")
                .set(createAuthHeader(RoleType.ADMIN))
                .query({ date: "2025-03-01" })
                .expect(200);
            expect(response.body.message).toBe("Btrade slice retrieved successfully");
            expect(response.body.data.data).toEqual({
                "ART-1": { price: 100, quantity: 5 },
            });
        });
    });
});
