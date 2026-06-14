import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import "../../../test/setup.js";
import app from "../../../test/utils/testApp.js";
import { Art } from "../../arts/models/Art.js";
import { BtradeSlice } from "../../btrade-slices/models/BtradeSlice.js";
const createAuthHeader = (role = RoleType.ADMIN) => {
    const secret = process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
    const token = jwt.sign({ id: new mongoose.Types.ObjectId().toString(), role }, secret, { expiresIn: "1h" });
    return { Authorization: `Bearer ${token}` };
};
describe("art-sales-reports router integration", () => {
    it("GET range returns sales data for artikul", async () => {
        await Art.create({ artikul: "ART-INT", zone: "A" });
        const d0 = new Date("2026-03-01T00:00:00.000Z");
        const d1 = new Date("2026-03-02T00:00:00.000Z");
        await BtradeSlice.insertMany([
            { date: d0, data: { "ART-INT": { quantity: 10, price: 2 } } },
            { date: d1, data: { "ART-INT": { quantity: 7, price: 2 } } },
        ]);
        const response = await request(app)
            .get("/api/art-sales-reports/artikul/ART-INT/range")
            .set(createAuthHeader())
            .query({ dateFrom: "2026-03-02", dateTo: "2026-03-02" })
            .expect(200);
        expect(response.body.message).toBe("Art sales range retrieved successfully");
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].sales).toBe(3);
    });
    it("404 when artikul not in catalog", async () => {
        const response = await request(app)
            .get("/api/art-sales-reports/artikul/missing/range")
            .set(createAuthHeader())
            .query({ dateFrom: "2026-03-01", dateTo: "2026-03-02" })
            .expect(404);
        expect(response.body.message).toBe("Art not found for provided artikul");
    });
});
