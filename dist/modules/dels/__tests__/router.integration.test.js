import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import "../../../test/setup.js";
import app from "../../../test/utils/testApp.js";
import { Del } from "../models/Del.js";
import { Prod } from "../../prods/models/Prod.js";
const createAuthHeader = (role = RoleType.USER) => {
    const secret = process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
    const token = jwt.sign({ id: new mongoose.Types.ObjectId().toString(), role }, secret, { expiresIn: "1h" });
    return { Authorization: `Bearer ${token}` };
};
describe("Dels router integration", () => {
    beforeEach(async () => {
        await Del.deleteMany({});
        await Prod.deleteMany({});
        await Prod.create({
            name: "acme",
            title: "Acme",
            imageUrl: "https://example.com/acme.png",
        });
    });
    describe("GET /api/dels", () => {
        it("401 without auth token", async () => {
            await request(app).get("/api/dels").expect(401);
        });
        it("200 returns dels for USER", async () => {
            await Del.create({ title: "Del A", prodName: "acme", artikuls: {} });
            const response = await request(app)
                .get("/api/dels")
                .set(createAuthHeader(RoleType.USER))
                .expect(200);
            expect(response.body.message).toBe("Dels retrieved successfully");
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].title).toBe("Del A");
        });
    });
    describe("GET /api/dels/id/:id", () => {
        it("200 returns del when found", async () => {
            const del = await Del.create({
                title: "Del A",
                prodName: "acme",
                artikuls: { "ART-1": { quantity: 5 } },
            });
            const response = await request(app)
                .get(`/api/dels/id/${del._id.toString()}`)
                .set(createAuthHeader(RoleType.USER))
                .expect(200);
            expect(response.body.message).toBe("Del retrieved successfully");
            expect(response.body.data.title).toBe("Del A");
        });
    });
    describe("POST /api/dels", () => {
        it("403 for USER role", async () => {
            await request(app)
                .post("/api/dels")
                .set(createAuthHeader(RoleType.USER))
                .send({ title: "New Del", prodName: "acme" })
                .expect(403);
        });
        it("201 creates del for ADMIN", async () => {
            const response = await request(app)
                .post("/api/dels")
                .set(createAuthHeader(RoleType.ADMIN))
                .send({ title: "New Del", prodName: "acme", artikuls: {} })
                .expect(201);
            expect(response.body.data.title).toBe("New Del");
            expect(await Del.countDocuments()).toBe(1);
        });
    });
    describe("PATCH /api/dels/:id/title", () => {
        it("200 updates del title for ADMIN", async () => {
            const del = await Del.create({
                title: "Old title",
                prodName: "acme",
                artikuls: {},
            });
            const response = await request(app)
                .patch(`/api/dels/${del._id.toString()}/title`)
                .set(createAuthHeader(RoleType.ADMIN))
                .send({ title: "Updated title", prodName: "acme" })
                .expect(200);
            expect(response.body.message).toBe("Del title updated successfully");
            expect(response.body.data.title).toBe("Updated title");
        });
    });
    describe("DELETE /api/dels/id/:id", () => {
        it("403 for ADMIN role", async () => {
            const del = await Del.create({
                title: "Del A",
                prodName: "acme",
                artikuls: {},
            });
            await request(app)
                .delete(`/api/dels/id/${del._id.toString()}`)
                .set(createAuthHeader(RoleType.ADMIN))
                .expect(403);
            expect(await Del.findById(del._id)).toBeTruthy();
        });
        it("200 deletes del for PRIME", async () => {
            const del = await Del.create({
                title: "Del A",
                prodName: "acme",
                artikuls: {},
            });
            const response = await request(app)
                .delete(`/api/dels/id/${del._id.toString()}`)
                .set(createAuthHeader(RoleType.PRIME))
                .expect(200);
            expect(response.body.message).toBe("Del deleted successfully");
            expect(await Del.findById(del._id)).toBeNull();
        });
    });
});
