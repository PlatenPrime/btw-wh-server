import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import app from "../../../test/utils/testApp.js";
import { createTestAsk, createTestUser } from "../../../test/setup.js";
import { Ask } from "../models/Ask.js";
vi.mock("../../../utils/telegram/sendMessageToBTWChat.js", () => ({
    sendMessageToBTWChat: vi.fn(),
}));
const createAuthHeader = (role = RoleType.USER, userId) => {
    const secret = process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
    const id = userId ?? new mongoose.Types.ObjectId().toString();
    const token = jwt.sign({ id, role }, secret, { expiresIn: "1h" });
    return { Authorization: `Bearer ${token}`, userId: id };
};
describe("Asks router integration", () => {
    beforeEach(async () => {
        await Ask.deleteMany({});
    });
    describe("POST /api/asks", () => {
        it("401 without auth token", async () => {
            await request(app)
                .post("/api/asks")
                .send({ artikul: "ART-001", askerId: "1" })
                .expect(401);
        });
        it("201 creates ask for authenticated USER", async () => {
            const user = await createTestUser({ username: `asker-${Date.now()}` });
            const response = await request(app)
                .post("/api/asks")
                .set(createAuthHeader(RoleType.USER))
                .send({
                artikul: "ASK-001",
                nameukr: "Заявка",
                quant: 3,
                askerId: String(user._id),
            })
                .expect(201);
            expect(response.body.artikul).toBe("ASK-001");
            expect(response.body.status).toBe("new");
            expect(await Ask.countDocuments()).toBe(1);
        });
        it("400 when validation fails", async () => {
            const response = await request(app)
                .post("/api/asks")
                .set(createAuthHeader(RoleType.USER))
                .send({ nameukr: "Без artikul" })
                .expect(400);
            expect(response.body.message).toBe("Validation error");
        });
    });
    describe("GET /api/asks/by-date", () => {
        it("200 returns asks for date", async () => {
            await createTestAsk({
                artikul: "DATE-001",
                createdAt: new Date("2025-03-10T10:00:00.000Z"),
            });
            const response = await request(app)
                .get("/api/asks/by-date")
                .query({ date: "2025-03-10" })
                .set(createAuthHeader(RoleType.USER))
                .expect(200);
            expect(response.body.count).toBeGreaterThanOrEqual(1);
        });
    });
    describe("GET /api/asks/:id", () => {
        it("200 returns ask when found", async () => {
            const ask = await createTestAsk({ artikul: "GET-001" });
            const response = await request(app)
                .get(`/api/asks/${ask._id.toString()}`)
                .set(createAuthHeader(RoleType.USER))
                .expect(200);
            expect(response.body.exists).toBe(true);
            expect(response.body.data.artikul).toBe("GET-001");
        });
    });
    describe("DELETE /api/asks/:id", () => {
        it("403 for non-owner USER", async () => {
            const asker = await createTestUser({ username: `owner-${Date.now()}` });
            const ask = await createTestAsk({
                artikul: "DEL-001",
                asker: asker._id,
                askerData: {
                    _id: asker._id,
                    fullname: asker.fullname,
                },
            });
            await request(app)
                .delete(`/api/asks/${ask._id.toString()}`)
                .set(createAuthHeader(RoleType.USER))
                .expect(403);
            expect(await Ask.findById(ask._id)).toBeTruthy();
        });
        it("200 deletes ask for PRIME role", async () => {
            const ask = await createTestAsk({ artikul: "DEL-PRIME" });
            const response = await request(app)
                .delete(`/api/asks/${ask._id.toString()}`)
                .set(createAuthHeader(RoleType.PRIME))
                .expect(200);
            expect(response.body.message).toBe("Ask deleted successfully");
            expect(await Ask.findById(ask._id)).toBeNull();
        });
    });
    describe("PATCH /api/asks/:id/complete", () => {
        it("403 for USER role", async () => {
            const ask = await createTestAsk({ artikul: "COMP-001" });
            await request(app)
                .patch(`/api/asks/${ask._id.toString()}/complete`)
                .set(createAuthHeader(RoleType.USER))
                .send({ solverId: new mongoose.Types.ObjectId().toString() })
                .expect(403);
        });
    });
});
