import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import "../../../test/setup.js";
import app from "../../../test/utils/testApp.js";
import { Skugr } from "../models/Skugr.js";
const createAuthHeader = (role = RoleType.ADMIN) => {
    const secret = process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
    const token = jwt.sign({ id: new mongoose.Types.ObjectId().toString(), role }, secret, { expiresIn: "1h" });
    return { Authorization: `Bearer ${token}` };
};
describe("Skugrs router integration", () => {
    beforeEach(async () => {
        await Skugr.deleteMany({});
    });
    describe("GET /api/skugrs", () => {
        it("401 without auth token", async () => {
            await request(app).get("/api/skugrs").expect(401);
        });
        it("200 returns skugrs for ADMIN", async () => {
            await Skugr.create({
                konkName: "k1",
                prodName: "p1",
                title: "Group A",
                url: "https://k1.com/a",
                skus: [],
            });
            const response = await request(app)
                .get("/api/skugrs")
                .set(createAuthHeader(RoleType.ADMIN))
                .expect(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.pagination.total).toBe(1);
        });
    });
    describe("POST /api/skugrs", () => {
        it("201 creates skugr", async () => {
            const response = await request(app)
                .post("/api/skugrs")
                .set(createAuthHeader(RoleType.ADMIN))
                .send({
                konkName: "k1",
                prodName: "p1",
                title: "New group",
                url: "https://k1.com/new",
                skus: [],
            })
                .expect(201);
            expect(response.body.data.title).toBe("New group");
        });
    });
    describe("GET /api/skugrs/id/:id", () => {
        it("404 when skugr not found", async () => {
            await request(app)
                .get("/api/skugrs/id/000000000000000000000000")
                .set(createAuthHeader(RoleType.ADMIN))
                .expect(404);
        });
        it("200 returns skugr metadata without skus", async () => {
            const skugr = await Skugr.create({
                konkName: "k1",
                prodName: "p1",
                title: "By id",
                url: "https://k1.com/by-id",
                skus: [],
            });
            const response = await request(app)
                .get(`/api/skugrs/id/${skugr._id.toString()}`)
                .set(createAuthHeader(RoleType.ADMIN))
                .expect(200);
            expect(response.body.data.title).toBe("By id");
            expect(response.body.data).not.toHaveProperty("skus");
        });
    });
    describe("DELETE /api/skugrs/id/:id", () => {
        it("403 for ADMIN role", async () => {
            const skugr = await Skugr.create({
                konkName: "k1",
                prodName: "p1",
                title: "Delete",
                url: "https://k1.com/del",
                skus: [],
            });
            await request(app)
                .delete(`/api/skugrs/id/${skugr._id.toString()}`)
                .set(createAuthHeader(RoleType.ADMIN))
                .expect(403);
        });
        it("200 deletes skugr for PRIME", async () => {
            const skugr = await Skugr.create({
                konkName: "k1",
                prodName: "p1",
                title: "Delete prime",
                url: "https://k1.com/del-prime",
                skus: [],
            });
            const response = await request(app)
                .delete(`/api/skugrs/id/${skugr._id.toString()}`)
                .set(createAuthHeader(RoleType.PRIME))
                .expect(200);
            expect(response.body.message).toBe("Skugr deleted successfully");
            expect(await Skugr.countDocuments()).toBe(0);
        });
    });
});
