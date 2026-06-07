import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import "../../../test/setup.js";
import app from "../../../test/utils/testApp.js";
import { Analog } from "../../analogs/models/Analog.js";
import { BtradeSlice } from "../../btrade-slices/models/BtradeSlice.js";
import { AnalogSlice } from "../models/AnalogSlice.js";
const createAuthHeader = (role = RoleType.ADMIN) => {
    const secret = process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
    const token = jwt.sign({ id: new mongoose.Types.ObjectId().toString(), role }, secret, { expiresIn: "1h" });
    return { Authorization: `Bearer ${token}` };
};
describe("Analog-slices router integration", () => {
    const d1 = new Date("2026-03-01T00:00:00.000Z");
    const d2 = new Date("2026-03-02T00:00:00.000Z");
    const artikul = "1102-0259";
    async function seedBaseData() {
        const analog = await Analog.create({
            konkName: "air",
            prodName: "gemar",
            artikul,
            nameukr: "Тестовий товар",
            url: "https://example.com/integration-analog",
        });
        await AnalogSlice.insertMany([
            {
                konkName: "air",
                date: d1,
                data: { [artikul]: { stock: 100, price: 10, artikul } },
            },
            {
                konkName: "air",
                date: d2,
                data: { [artikul]: { stock: 90, price: 10, artikul } },
            },
        ]);
        await BtradeSlice.insertMany([
            {
                date: d1,
                data: { [artikul]: { quantity: 200, price: 12 } },
            },
            {
                date: d2,
                data: { [artikul]: { quantity: 185, price: 12 } },
            },
        ]);
        return analog;
    }
    describe("GET /api/analog-slices", () => {
        it("401 without auth token", async () => {
            await request(app)
                .get("/api/analog-slices")
                .query({ konkName: "air", date: "2026-03-01" })
                .expect(401);
        });
        it("403 for USER role", async () => {
            await request(app)
                .get("/api/analog-slices")
                .set(createAuthHeader(RoleType.USER))
                .query({ konkName: "air", date: "2026-03-01" })
                .expect(403);
        });
        it("200 returns slice for ADMIN", async () => {
            await AnalogSlice.create({
                konkName: "air",
                date: d1,
                data: { [artikul]: { stock: 5, price: 10 } },
            });
            const response = await request(app)
                .get("/api/analog-slices")
                .set(createAuthHeader(RoleType.ADMIN))
                .query({ konkName: "air", date: "2026-03-01" })
                .expect(200);
            expect(response.body.message).toBe("Analog slice retrieved successfully");
            expect(response.body.data.konkName).toBe("air");
        });
    });
    describe("GET /api/analog-slices/analog/:analogId", () => {
        it("200 returns slice by date for ADMIN", async () => {
            const analog = await seedBaseData();
            const response = await request(app)
                .get(`/api/analog-slices/analog/${analog._id.toString()}`)
                .set(createAuthHeader(RoleType.ADMIN))
                .query({ date: "2026-03-01" })
                .expect(200);
            expect(response.body.message).toBe("Analog slice by date retrieved successfully");
            expect(response.body.data).toEqual({ stock: 100, price: 10 });
        });
    });
    describe("GET /api/analog-slices/analog/:analogId/range", () => {
        it("200 returns slice range for ADMIN", async () => {
            const analog = await seedBaseData();
            const response = await request(app)
                .get(`/api/analog-slices/analog/${analog._id.toString()}/range`)
                .set(createAuthHeader(RoleType.ADMIN))
                .query({ dateFrom: "2026-03-01", dateTo: "2026-03-02" })
                .expect(200);
            expect(response.body.message).toBe("Analog slice range retrieved successfully");
            expect(response.body.data).toHaveLength(2);
        });
    });
    describe("GET /api/analog-slices/analog/:analogId/sales-range", () => {
        it("200 returns sales range for ADMIN", async () => {
            const analog = await seedBaseData();
            const response = await request(app)
                .get(`/api/analog-slices/analog/${analog._id.toString()}/sales-range`)
                .set(createAuthHeader(RoleType.ADMIN))
                .query({ dateFrom: "2026-03-01", dateTo: "2026-03-02" })
                .expect(200);
            expect(response.body.message).toBe("Analog sales range retrieved successfully");
            expect(response.body.data).toHaveLength(2);
        });
    });
    describe("GET /api/analog-slices/analog/:analogId/sales-by-date", () => {
        it("200 returns sales by date for ADMIN", async () => {
            const analog = await seedBaseData();
            const response = await request(app)
                .get(`/api/analog-slices/analog/${analog._id.toString()}/sales-by-date`)
                .set(createAuthHeader(RoleType.ADMIN))
                .query({ date: "2026-03-02" })
                .expect(200);
            expect(response.body.message).toBe("Analog sales by date retrieved successfully");
            expect(response.body.data.sales).toBe(10);
        });
    });
    describe("GET /api/analog-slices/konk-btrade/sales-comparison", () => {
        it("200 returns sales comparison for ADMIN", async () => {
            await seedBaseData();
            const response = await request(app)
                .get("/api/analog-slices/konk-btrade/sales-comparison")
                .set(createAuthHeader(RoleType.ADMIN))
                .query({
                konk: "air",
                prod: "gemar",
                dateFrom: "2026-03-01",
                dateTo: "2026-03-02",
            })
                .expect(200);
            expect(response.body.message).toBe("Sales comparison data retrieved successfully");
            expect(response.body.data.days).toHaveLength(2);
        });
    });
    describe("GET /api/analog-slices/konk-btrade/stock-comparison", () => {
        it("200 returns stock comparison for ADMIN", async () => {
            await seedBaseData();
            const response = await request(app)
                .get("/api/analog-slices/konk-btrade/stock-comparison")
                .set(createAuthHeader(RoleType.ADMIN))
                .query({
                konk: "air",
                prod: "gemar",
                dateFrom: "2026-03-01",
                dateTo: "2026-03-02",
            })
                .expect(200);
            expect(response.body.message).toBe("Stock comparison data retrieved successfully");
            expect(response.body.data.days).toHaveLength(2);
            expect(response.body.data.summary).toBeDefined();
        });
    });
    describe("Excel export endpoints", () => {
        it("GET comparison-excel returns xlsx for ADMIN", async () => {
            const analog = await seedBaseData();
            const response = await request(app)
                .get(`/api/analog-slices/analog/${analog._id.toString()}/comparison-excel`)
                .set(createAuthHeader(RoleType.ADMIN))
                .query({ dateFrom: "2026-03-01", dateTo: "2026-03-02" })
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
        it("GET sales-comparison-excel returns xlsx for ADMIN", async () => {
            const analog = await seedBaseData();
            const response = await request(app)
                .get(`/api/analog-slices/analog/${analog._id.toString()}/sales-comparison-excel`)
                .set(createAuthHeader(RoleType.ADMIN))
                .query({ dateFrom: "2026-03-01", dateTo: "2026-03-02" })
                .expect(200);
            expect(response.headers["content-type"]).toContain("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        });
        it("GET konk-btrade/comparison-excel returns xlsx for ADMIN", async () => {
            await seedBaseData();
            const response = await request(app)
                .get("/api/analog-slices/konk-btrade/comparison-excel")
                .set(createAuthHeader(RoleType.ADMIN))
                .query({
                konk: "air",
                prod: "gemar",
                dateFrom: "2026-03-01",
                dateTo: "2026-03-02",
            })
                .expect(200);
            expect(response.headers["content-type"]).toContain("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        });
        it("GET konk-btrade/sales-comparison-excel returns xlsx for ADMIN", async () => {
            await seedBaseData();
            const response = await request(app)
                .get("/api/analog-slices/konk-btrade/sales-comparison-excel")
                .set(createAuthHeader(RoleType.ADMIN))
                .query({
                konk: "air",
                prod: "gemar",
                dateFrom: "2026-03-01",
                dateTo: "2026-03-02",
            })
                .expect(200);
            expect(response.headers["content-type"]).toContain("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        });
    });
});
