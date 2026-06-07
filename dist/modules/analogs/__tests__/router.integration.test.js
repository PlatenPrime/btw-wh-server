import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import "../../../test/setup.js";
import app from "../../../test/utils/testApp.js";
import { Analog } from "../models/Analog.js";
vi.mock("../controllers/get-analog-stock/utils/getAnalogStockDataUtil.js", () => ({
    getAnalogStockDataUtil: vi.fn(),
    UNSUPPORTED_KONK_CODE: "UNSUPPORTED_KONK",
}));
import { getAnalogStockDataUtil } from "../controllers/get-analog-stock/utils/getAnalogStockDataUtil.js";
const mockGetStock = vi.mocked(getAnalogStockDataUtil);
const createAuthHeader = (role = RoleType.ADMIN) => {
    const secret = process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
    const token = jwt.sign({ id: new mongoose.Types.ObjectId().toString(), role }, secret, { expiresIn: "1h" });
    return { Authorization: `Bearer ${token}` };
};
describe("Analogs router integration", () => {
    beforeEach(async () => {
        await Analog.deleteMany({});
        mockGetStock.mockReset();
    });
    describe("GET /api/analogs", () => {
        it("401 without auth token", async () => {
            await request(app).get("/api/analogs").expect(401);
        });
        it("200 returns analogs for ADMIN", async () => {
            await Analog.create({
                konkName: "k1",
                prodName: "p1",
                url: "https://ex.com/a1",
                artikul: "ART-1",
            });
            const response = await request(app)
                .get("/api/analogs")
                .set(createAuthHeader(RoleType.ADMIN))
                .expect(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.pagination.total).toBe(1);
        });
    });
    describe("POST /api/analogs", () => {
        it("201 creates analog with artikul", async () => {
            const response = await request(app)
                .post("/api/analogs")
                .set(createAuthHeader(RoleType.ADMIN))
                .send({
                konkName: "k1",
                prodName: "p1",
                url: "https://ex.com/new",
                artikul: "ART-NEW",
            })
                .expect(201);
            expect(response.body.data.artikul).toBe("ART-NEW");
        });
        it("400 when validation fails", async () => {
            const response = await request(app)
                .post("/api/analogs")
                .set(createAuthHeader(RoleType.ADMIN))
                .send({ konkName: "k1" })
                .expect(400);
            expect(response.body.message).toBe("Validation error");
        });
    });
    describe("GET /api/analogs/id/:id", () => {
        it("404 when analog not found", async () => {
            await request(app)
                .get("/api/analogs/id/000000000000000000000000")
                .set(createAuthHeader(RoleType.ADMIN))
                .expect(404);
        });
        it("200 returns analog by id", async () => {
            const analog = await Analog.create({
                konkName: "k1",
                prodName: "p1",
                url: "https://ex.com/by-id",
                artikul: "ART-ID",
            });
            const response = await request(app)
                .get(`/api/analogs/id/${analog._id.toString()}`)
                .set(createAuthHeader(RoleType.ADMIN))
                .expect(200);
            expect(response.body.data.artikul).toBe("ART-ID");
        });
    });
    describe("GET /api/analogs/id/:id/stock", () => {
        it("200 returns stock data", async () => {
            const analog = await Analog.create({
                konkName: "air",
                prodName: "p1",
                url: "https://ex.com/stock",
                artikul: "ART-ST",
            });
            mockGetStock.mockResolvedValue({ stock: 7, price: 120 });
            const response = await request(app)
                .get(`/api/analogs/id/${analog._id.toString()}/stock`)
                .set(createAuthHeader(RoleType.ADMIN))
                .expect(200);
            expect(response.body.data).toEqual({ stock: 7, price: 120 });
        });
    });
    describe("DELETE /api/analogs/id/:id", () => {
        it("403 for ADMIN role", async () => {
            const analog = await Analog.create({
                konkName: "k1",
                prodName: "p1",
                url: "https://ex.com/del",
                artikul: "ART-DEL",
            });
            await request(app)
                .delete(`/api/analogs/id/${analog._id.toString()}`)
                .set(createAuthHeader(RoleType.ADMIN))
                .expect(403);
        });
        it("200 deletes analog for PRIME", async () => {
            const analog = await Analog.create({
                konkName: "k1",
                prodName: "p1",
                url: "https://ex.com/del-prime",
                artikul: "ART-DEL-P",
            });
            const response = await request(app)
                .delete(`/api/analogs/id/${analog._id.toString()}`)
                .set(createAuthHeader(RoleType.PRIME))
                .expect(200);
            expect(response.body.message).toBe("Analog deleted successfully");
            expect(await Analog.countDocuments()).toBe(0);
        });
    });
});
