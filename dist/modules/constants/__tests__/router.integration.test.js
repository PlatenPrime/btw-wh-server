import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import app from "../../../test/utils/testApp.js";
import { Constant } from "../models/Constant.js";
const createAuthHeader = (role = RoleType.ADMIN) => {
    const secret = process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
    const token = jwt.sign({ id: new mongoose.Types.ObjectId().toString(), role }, secret, { expiresIn: "1h" });
    return { Authorization: `Bearer ${token}` };
};
describe("Constants router integration", () => {
    beforeEach(async () => {
        await Constant.deleteMany({});
    });
    describe("GET /api/constants", () => {
        it("401 without auth token", async () => {
            await request(app).get("/api/constants").expect(401);
        });
        it("403 for USER role", async () => {
            await request(app)
                .get("/api/constants")
                .set(createAuthHeader(RoleType.USER))
                .expect(403);
        });
        it("200 returns all constants for ADMIN", async () => {
            await Constant.create({
                name: "cfg",
                title: "Config",
                data: { key: "value" },
            });
            const response = await request(app)
                .get("/api/constants")
                .set(createAuthHeader(RoleType.ADMIN))
                .expect(200);
            expect(response.body.message).toBe("Constants retrieved successfully");
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].name).toBe("cfg");
        });
    });
    describe("POST /api/constants", () => {
        it("201 creates constant for ADMIN", async () => {
            const response = await request(app)
                .post("/api/constants")
                .set(createAuthHeader(RoleType.ADMIN))
                .send({
                name: "limits",
                title: "Limits",
                data: { max: "100" },
            })
                .expect(201);
            expect(response.body.data.name).toBe("limits");
            expect(await Constant.countDocuments()).toBe(1);
        });
        it("400 when validation fails", async () => {
            await request(app)
                .post("/api/constants")
                .set(createAuthHeader(RoleType.ADMIN))
                .send({ title: "No name" })
                .expect(400);
        });
    });
    describe("GET /api/constants/name/:name", () => {
        it("200 returns constant by name", async () => {
            await Constant.create({
                name: "app-config",
                title: "App Config",
                data: { env: "test" },
            });
            const response = await request(app)
                .get("/api/constants/name/app-config")
                .set(createAuthHeader(RoleType.ADMIN))
                .expect(200);
            expect(response.body.message).toBe("Constant retrieved successfully");
            expect(response.body.data.name).toBe("app-config");
        });
    });
    describe("PATCH /api/constants/id/:id", () => {
        it("200 updates constant", async () => {
            const constant = await Constant.create({
                name: "upd",
                title: "Old",
                data: {},
            });
            const response = await request(app)
                .patch(`/api/constants/id/${constant._id.toString()}`)
                .set(createAuthHeader(RoleType.ADMIN))
                .send({ title: "New Title", data: { a: "b" } })
                .expect(200);
            expect(response.body.data.title).toBe("New Title");
            expect(response.body.data.data).toEqual({ a: "b" });
        });
    });
    describe("DELETE /api/constants/id/:id", () => {
        it("403 for ADMIN role", async () => {
            const constant = await Constant.create({
                name: "del",
                title: "Delete me",
                data: {},
            });
            await request(app)
                .delete(`/api/constants/id/${constant._id.toString()}`)
                .set(createAuthHeader(RoleType.ADMIN))
                .expect(403);
        });
        it("200 deletes constant for PRIME", async () => {
            const constant = await Constant.create({
                name: "del2",
                title: "Delete me",
                data: {},
            });
            await request(app)
                .delete(`/api/constants/id/${constant._id.toString()}`)
                .set(createAuthHeader(RoleType.PRIME))
                .expect(200);
            expect(await Constant.findById(constant._id)).toBeNull();
        });
    });
});
