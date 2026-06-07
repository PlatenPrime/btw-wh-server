import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import "../../../test/setup.js";
import app from "../../../test/utils/testApp.js";
import { Variant } from "../models/Variant.js";
const createAuthHeader = (role = RoleType.USER) => {
    const secret = process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
    const token = jwt.sign({ id: new mongoose.Types.ObjectId().toString(), role }, secret, { expiresIn: "1h" });
    return { Authorization: `Bearer ${token}` };
};
const sampleVariant = {
    konkName: "acme",
    prodName: "maker",
    title: "Integration Variant",
    url: "https://example.com/integration-variant",
    imageUrl: "https://example.com/integration-variant.png",
};
describe("Variants router integration", () => {
    beforeEach(async () => {
        await Variant.deleteMany({});
    });
    describe("GET /api/variants", () => {
        it("401 without auth token", async () => {
            await request(app).get("/api/variants").expect(401);
        });
        it("200 returns variants for USER", async () => {
            await Variant.create(sampleVariant);
            const response = await request(app)
                .get("/api/variants")
                .set(createAuthHeader(RoleType.USER))
                .expect(200);
            expect(response.body.message).toBe("Variants retrieved successfully");
            expect(response.body.data).toHaveLength(1);
            expect(response.body.pagination.total).toBe(1);
        });
    });
    describe("GET /api/variants/id/:id", () => {
        it("200 returns variant by id", async () => {
            const variant = await Variant.create(sampleVariant);
            const response = await request(app)
                .get(`/api/variants/id/${variant._id.toString()}`)
                .set(createAuthHeader(RoleType.USER))
                .expect(200);
            expect(response.body.data.title).toBe("Integration Variant");
        });
        it("400 for invalid id", async () => {
            await request(app)
                .get("/api/variants/id/invalid-id")
                .set(createAuthHeader(RoleType.USER))
                .expect(400);
        });
    });
    describe("POST /api/variants", () => {
        it("403 for USER role", async () => {
            await request(app)
                .post("/api/variants")
                .set(createAuthHeader(RoleType.USER))
                .send(sampleVariant)
                .expect(403);
        });
        it("201 creates variant for ADMIN", async () => {
            const response = await request(app)
                .post("/api/variants")
                .set(createAuthHeader(RoleType.ADMIN))
                .send(sampleVariant)
                .expect(201);
            expect(response.body.message).toBe("Variant created successfully");
            expect(response.body.data.title).toBe("Integration Variant");
        });
        it("400 when validation fails", async () => {
            await request(app)
                .post("/api/variants")
                .set(createAuthHeader(RoleType.ADMIN))
                .send({ konkName: "acme" })
                .expect(400);
        });
    });
    describe("PATCH /api/variants/id/:id", () => {
        it("200 updates variant for ADMIN", async () => {
            const variant = await Variant.create(sampleVariant);
            const response = await request(app)
                .patch(`/api/variants/id/${variant._id.toString()}`)
                .set(createAuthHeader(RoleType.ADMIN))
                .send({ title: "Updated Variant" })
                .expect(200);
            expect(response.body.data.title).toBe("Updated Variant");
        });
    });
    describe("DELETE /api/variants/id/:id", () => {
        it("403 for ADMIN role", async () => {
            const variant = await Variant.create(sampleVariant);
            await request(app)
                .delete(`/api/variants/id/${variant._id.toString()}`)
                .set(createAuthHeader(RoleType.ADMIN))
                .expect(403);
        });
        it("200 deletes variant for PRIME", async () => {
            const variant = await Variant.create(sampleVariant);
            const response = await request(app)
                .delete(`/api/variants/id/${variant._id.toString()}`)
                .set(createAuthHeader(RoleType.PRIME))
                .expect(200);
            expect(response.body.message).toBe("Variant deleted successfully");
            const deleted = await Variant.findById(variant._id);
            expect(deleted).toBeNull();
        });
    });
});
