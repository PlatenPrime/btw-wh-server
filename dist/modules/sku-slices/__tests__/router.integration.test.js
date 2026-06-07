import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import "../../../test/setup.js";
import app from "../../../test/utils/testApp.js";
import { Sku } from "../../skus/models/Sku.js";
import { Skugr } from "../../skugrs/models/Skugr.js";
import { SkuSlice } from "../models/SkuSlice.js";
const createAuthHeader = (role = RoleType.ADMIN) => {
    const secret = process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
    const token = jwt.sign({ id: new mongoose.Types.ObjectId().toString(), role }, secret, { expiresIn: "1h" });
    return { Authorization: `Bearer ${token}` };
};
describe("Sku-slices router integration", () => {
    beforeEach(async () => {
        await Sku.deleteMany({});
        await Skugr.deleteMany({});
        await SkuSlice.deleteMany({});
    });
    describe("auth guards", () => {
        it("GET /api/sku-slices returns 401 without token", async () => {
            await request(app)
                .get("/api/sku-slices")
                .query({ konkName: "air", date: "2026-06-01" })
                .expect(401);
        });
        it("GET /api/sku-slices returns 403 for USER role", async () => {
            await request(app)
                .get("/api/sku-slices")
                .set(createAuthHeader(RoleType.USER))
                .query({ konkName: "air", date: "2026-06-01" })
                .expect(403);
        });
        it("GET /api/sku-slices/konk-prod/sales-chart-data returns 401 without token", async () => {
            await request(app)
                .get("/api/sku-slices/konk-prod/sales-chart-data")
                .query({
                konk: "k",
                prod: "p",
                dateFrom: "2026-06-01",
                dateTo: "2026-06-01",
            })
                .expect(401);
        });
    });
    describe("GET /api/sku-slices", () => {
        it("400 when query validation fails", async () => {
            const response = await request(app)
                .get("/api/sku-slices")
                .set(createAuthHeader())
                .query({ date: "2026-06-01" })
                .expect(400);
            expect(response.body.message).toBe("Validation error");
        });
        it("200 returns slice list for ADMIN", async () => {
            const konk = "router-k";
            const date = new Date("2026-06-01T00:00:00.000Z");
            await Sku.create({
                konkName: konk,
                prodName: "p",
                productId: `${konk}-1`,
                title: "Item",
                url: "https://e.com/i",
            });
            await SkuSlice.create({
                konkName: konk,
                date,
                data: { [`${konk}-1`]: { stock: 2, price: 5 } },
            });
            const response = await request(app)
                .get("/api/sku-slices")
                .set(createAuthHeader())
                .query({ konkName: konk, date: "2026-06-01" })
                .expect(200);
            expect(response.body.message).toBe("Sku slice retrieved successfully");
            expect(response.body.data.konkName).toBe(konk);
            expect(response.body.data.items.length).toBeGreaterThan(0);
        });
    });
    describe("GET /api/sku-slices/sku/:skuId", () => {
        it("400 for invalid skuId", async () => {
            await request(app)
                .get("/api/sku-slices/sku/bad-id")
                .set(createAuthHeader())
                .query({ date: "2026-06-01" })
                .expect(400);
        });
        it("200 returns slice by sku and date", async () => {
            const sku = await Sku.create({
                konkName: "r-k",
                prodName: "p",
                productId: "r-k-1",
                title: "One",
                url: "https://e.com/1",
            });
            await SkuSlice.create({
                konkName: "r-k",
                date: new Date("2026-06-02T00:00:00.000Z"),
                data: { "r-k-1": { stock: 4, price: 6 } },
            });
            const response = await request(app)
                .get(`/api/sku-slices/sku/${sku._id.toString()}`)
                .set(createAuthHeader())
                .query({ date: "2026-06-02" })
                .expect(200);
            const data = response.body.data;
            expect(data.stock).toBe(4);
            expect(data.price).toBe(6);
        });
    });
    describe("GET /api/sku-slices/skugr/:skugrId/daily-summary", () => {
        it("404 when skugr not found", async () => {
            await request(app)
                .get("/api/sku-slices/skugr/507f1f77bcf86cd799439011/daily-summary")
                .set(createAuthHeader())
                .query({ dateFrom: "2026-06-01", dateTo: "2026-06-01" })
                .expect(404);
        });
    });
    describe("GET /api/sku-slices/skugr/:skugrId/slice-excel", () => {
        it("200 sends excel for valid skugr", async () => {
            const sku = await Sku.create({
                konkName: "rg-k",
                prodName: "p",
                productId: "rg-k-1",
                title: "Item",
                url: "https://e.com/rg",
            });
            const skugr = await Skugr.create({
                konkName: "rg-k",
                prodName: "p",
                title: "Grp",
                url: "https://e.com/g",
                isSliced: true,
                skus: [sku._id],
            });
            await SkuSlice.create({
                konkName: "rg-k",
                date: new Date("2026-06-03T00:00:00.000Z"),
                data: { "rg-k-1": { stock: 1, price: 2 } },
            });
            const response = await request(app)
                .get(`/api/sku-slices/skugr/${skugr._id.toString()}/slice-excel`)
                .set(createAuthHeader())
                .query({ dateFrom: "2026-06-03", dateTo: "2026-06-03" })
                .buffer(true)
                .parse((res, callback) => {
                const chunks = [];
                res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
                res.on("end", () => callback(null, Buffer.concat(chunks)));
            })
                .expect(200);
            expect(response.headers["content-type"]).toContain("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            expect(Buffer.isBuffer(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });
    });
    describe("GET /api/sku-slices/konk-prod/manufacturers-pie-data", () => {
        it("400 when dateFrom after dateTo", async () => {
            await request(app)
                .get("/api/sku-slices/konk-prod/manufacturers-pie-data")
                .set(createAuthHeader())
                .query({
                konk: "k",
                dateFrom: "2026-06-10",
                dateTo: "2026-06-01",
            })
                .expect(400);
        });
    });
});
