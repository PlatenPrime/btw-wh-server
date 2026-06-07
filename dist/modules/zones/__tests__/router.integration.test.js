import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import "../../../test/setup.js";
import app from "../../../test/utils/testApp.js";
import { Block } from "../../blocks/models/Block.js";
import { Seg } from "../../segs/models/Seg.js";
import { Zone } from "../models/Zone.js";
const createAuthHeader = (role = RoleType.ADMIN) => {
    const secret = process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
    const token = jwt.sign({ id: new mongoose.Types.ObjectId().toString(), role }, secret, { expiresIn: "1h" });
    return { Authorization: `Bearer ${token}` };
};
describe("Zones router integration", () => {
    describe("POST /api/zones", () => {
        it("401 without auth token", async () => {
            await request(app)
                .post("/api/zones")
                .send({ title: "42-1", bar: 4201, sector: 0 })
                .expect(401);
        });
        it("403 for USER role", async () => {
            await request(app)
                .post("/api/zones")
                .set(createAuthHeader(RoleType.USER))
                .send({ title: "42-1", bar: 4201, sector: 0 })
                .expect(403);
        });
        it("201 creates zone for ADMIN", async () => {
            const response = await request(app)
                .post("/api/zones")
                .set(createAuthHeader(RoleType.ADMIN))
                .send({ title: "50-10", bar: 50100, sector: 0 })
                .expect(201);
            expect(response.body.message).toBe("Zone created successfully");
            expect(response.body.data.title).toBe("50-10");
        });
    });
    describe("GET /api/zones", () => {
        it("200 returns zones for ADMIN", async () => {
            await Zone.create({ title: "1-1", bar: 1010, sector: 0 });
            await Zone.create({ title: "2-2", bar: 2020, sector: 0 });
            const response = await request(app)
                .get("/api/zones")
                .set(createAuthHeader(RoleType.ADMIN))
                .expect(200);
            expect(response.body.data).toHaveLength(2);
        });
    });
    describe("GET /api/zones/:id", () => {
        it("200 returns zone by id", async () => {
            const zone = await Zone.create({ title: "42-5", bar: 4205, sector: 0 });
            const response = await request(app)
                .get(`/api/zones/${zone._id.toString()}`)
                .set(createAuthHeader(RoleType.ADMIN))
                .expect(200);
            expect(response.body.data.title).toBe("42-5");
        });
        it("400 for invalid id", async () => {
            await request(app)
                .get("/api/zones/invalid-id")
                .set(createAuthHeader(RoleType.ADMIN))
                .expect(400);
        });
    });
    describe("GET /api/zones/title/:title", () => {
        it("200 returns zone by title", async () => {
            await Zone.create({ title: "42-7", bar: 4207, sector: 0 });
            const response = await request(app)
                .get("/api/zones/title/42-7")
                .set(createAuthHeader(RoleType.ADMIN))
                .expect(200);
            expect(response.body.data.title).toBe("42-7");
        });
    });
    describe("GET /api/zones/by-block/:blockId", () => {
        it("200 returns zones linked to block", async () => {
            const block = await Block.create({ title: "Block 1", order: 1, segs: [] });
            const zone = await Zone.create({ title: "42-1", bar: 4201, sector: 0 });
            await Seg.create({
                block: block._id,
                blockData: { _id: block._id, title: block.title },
                order: 1,
                sector: 0,
                zones: [{ _id: zone._id, title: zone.title }],
            });
            const response = await request(app)
                .get(`/api/zones/by-block/${block._id.toString()}`)
                .set(createAuthHeader(RoleType.ADMIN))
                .expect(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].title).toBe("42-1");
        });
    });
    describe("PUT /api/zones/:id", () => {
        it("200 updates zone", async () => {
            const zone = await Zone.create({ title: "42-8", bar: 4208, sector: 0 });
            const response = await request(app)
                .put(`/api/zones/${zone._id.toString()}`)
                .set(createAuthHeader(RoleType.ADMIN))
                .send({ title: "42-9", bar: 4209, sector: 1 })
                .expect(200);
            expect(response.body.data.title).toBe("42-9");
            expect(response.body.data.sector).toBe(1);
        });
    });
    describe("DELETE /api/zones/:id", () => {
        it("403 for ADMIN role", async () => {
            const zone = await Zone.create({ title: "42-3", bar: 4203, sector: 0 });
            await request(app)
                .delete(`/api/zones/${zone._id.toString()}`)
                .set(createAuthHeader(RoleType.ADMIN))
                .expect(403);
        });
        it("200 deletes zone for PRIME", async () => {
            const zone = await Zone.create({ title: "42-4", bar: 4204, sector: 0 });
            const response = await request(app)
                .delete(`/api/zones/${zone._id.toString()}`)
                .set(createAuthHeader(RoleType.PRIME))
                .expect(200);
            expect(response.body.message).toBe("Zone deleted successfully");
            const deleted = await Zone.findById(zone._id);
            expect(deleted).toBeNull();
        });
    });
    describe("POST /api/zones/upsert", () => {
        it("403 for ADMIN role", async () => {
            await request(app)
                .post("/api/zones/upsert")
                .set(createAuthHeader(RoleType.ADMIN))
                .send({ zones: [{ title: "42-1", bar: 4201 }] })
                .expect(403);
        });
        it("200 upserts zones for PRIME", async () => {
            const response = await request(app)
                .post("/api/zones/upsert")
                .set(createAuthHeader(RoleType.PRIME))
                .send({
                zones: [
                    { title: "42-10", bar: 4210 },
                    { title: "42-11", bar: 4211 },
                ],
            })
                .expect(200);
            expect(response.body.message).toBe("Upsert completed");
            expect(response.body.result.upsertedCount).toBe(2);
        });
    });
    describe("GET /api/zones/export", () => {
        it("404 when no zones exist", async () => {
            await request(app)
                .get("/api/zones/export")
                .set(createAuthHeader(RoleType.ADMIN))
                .expect(404);
        });
        it("200 returns excel file when zones exist", async () => {
            await Zone.create({ title: "42-12", bar: 4212, sector: 0 });
            const response = await request(app)
                .get("/api/zones/export")
                .set(createAuthHeader(RoleType.ADMIN))
                .expect(200);
            expect(response.headers["content-type"]).toContain("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            expect(response.headers["content-disposition"]).toContain("attachment");
            expect(Number(response.headers["content-length"])).toBeGreaterThan(0);
        });
    });
});
