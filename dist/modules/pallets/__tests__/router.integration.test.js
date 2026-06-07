import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import "../../../test/setup.js";
import app from "../../../test/utils/testApp.js";
import { createTestPallet, createTestRow } from "../../../test/utils/testHelpers.js";
import { Pallet } from "../models/Pallet.js";
const createAuthHeader = (role = RoleType.USER) => {
    const secret = process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
    const token = jwt.sign({ id: new mongoose.Types.ObjectId().toString(), role }, secret, { expiresIn: "1h" });
    return { Authorization: `Bearer ${token}` };
};
describe("Pallets router integration", () => {
    describe("GET /api/pallets", () => {
        it("401 without auth token", async () => {
            await request(app).get("/api/pallets").expect(401);
        });
        it("200 returns all pallets for USER", async () => {
            await createTestPallet({ title: "1-1" });
            await createTestPallet({ title: "1-2" });
            const response = await request(app)
                .get("/api/pallets")
                .set(createAuthHeader(RoleType.USER))
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThanOrEqual(2);
        });
    });
    describe("GET /api/pallets/empty", () => {
        it("200 returns empty pallets for USER", async () => {
            await createTestPallet({ title: "Empty-1", poses: [] });
            const response = await request(app)
                .get("/api/pallets/empty")
                .set(createAuthHeader(RoleType.USER))
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.some((p) => p.title === "Empty-1")).toBe(true);
        });
    });
    describe("GET /api/pallets/:id", () => {
        it("200 returns pallet by id", async () => {
            const pallet = await createTestPallet({ title: "By-Id-Pallet" });
            const response = await request(app)
                .get(`/api/pallets/${pallet._id.toString()}`)
                .set(createAuthHeader(RoleType.USER))
                .expect(200);
            expect(response.body.exists).toBe(true);
            expect(response.body.data.title).toBe("By-Id-Pallet");
        });
    });
    describe("GET /api/pallets/by-title/:title", () => {
        it("200 returns pallet by title", async () => {
            await createTestPallet({ title: "Unique-Title-Pallet" });
            const response = await request(app)
                .get("/api/pallets/by-title/Unique-Title-Pallet")
                .set(createAuthHeader(RoleType.USER))
                .expect(200);
            expect(response.body.exists).toBe(true);
            expect(response.body.data.title).toBe("Unique-Title-Pallet");
        });
    });
    describe("POST /api/pallets", () => {
        it("403 for USER role", async () => {
            const row = await createTestRow({ title: "Row 1" });
            await request(app)
                .post("/api/pallets")
                .set(createAuthHeader(RoleType.USER))
                .send({
                title: "New-Pallet",
                rowData: { _id: row._id.toString(), title: row.title },
                sector: 0,
                isDef: false,
            })
                .expect(403);
        });
        it("201 creates pallet for EDITOR", async () => {
            const row = await createTestRow({ title: "Row Create" });
            const response = await request(app)
                .post("/api/pallets")
                .set(createAuthHeader(RoleType.EDITOR))
                .send({
                title: "Created-Pallet",
                rowData: { _id: row._id.toString(), title: row.title },
                sector: 101,
                isDef: false,
            })
                .expect(201);
            expect(response.body.title).toBe("Created-Pallet");
            expect(await Pallet.countDocuments({ title: "Created-Pallet" })).toBe(1);
        });
    });
    describe("DELETE /api/pallets/:id", () => {
        it("403 for EDITOR role", async () => {
            const pallet = await createTestPallet({ title: "To-Delete" });
            await request(app)
                .delete(`/api/pallets/${pallet._id.toString()}`)
                .set(createAuthHeader(RoleType.EDITOR))
                .expect(403);
            expect(await Pallet.findById(pallet._id)).toBeTruthy();
        });
        it("200 deletes pallet for PRIME", async () => {
            const pallet = await createTestPallet({ title: "Prime-Delete" });
            await request(app)
                .delete(`/api/pallets/${pallet._id.toString()}`)
                .set(createAuthHeader(RoleType.PRIME))
                .expect(200);
            expect(await Pallet.findById(pallet._id)).toBeNull();
        });
    });
});
