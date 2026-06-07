import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { RoleType } from "../../../constants/roles.js";
import app from "../../../test/utils/testApp.js";
import { createTestUser } from "../../../test/setup.js";
import { hashPasswordUtil } from "../utils/hashPasswordUtil.js";
import Role from "../models/Role.js";
import User from "../models/User.js";
const createAuthHeader = (role = RoleType.USER, userId) => {
    const secret = process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only";
    const id = userId ?? new mongoose.Types.ObjectId().toString();
    const token = jwt.sign({ id, role }, secret, { expiresIn: "1h" });
    return { Authorization: `Bearer ${token}` };
};
describe("Auth router integration", () => {
    describe("POST /api/auth/login", () => {
        it("200 logs in with valid credentials", async () => {
            const password = "securePass123";
            const user = await createTestUser({
                username: `login-${Date.now()}`,
                password: hashPasswordUtil(password),
                fullname: "Login User",
            });
            const response = await request(app)
                .post("/api/auth/login")
                .send({ username: user.username, password })
                .expect(200);
            expect(response.body.token).toBeTruthy();
            expect(response.body.user.username).toBe(user.username);
            expect(response.body.user.password).toBeUndefined();
        });
        it("401 for invalid password", async () => {
            const user = await createTestUser({
                username: `badpass-${Date.now()}`,
                password: hashPasswordUtil("correct"),
            });
            await request(app)
                .post("/api/auth/login")
                .send({ username: user.username, password: "wrong" })
                .expect(400);
        });
    });
    describe("POST /api/auth/register", () => {
        it("201 registers new user", async () => {
            const username = `reg-${Date.now()}`;
            const response = await request(app)
                .post("/api/auth/register")
                .send({
                username,
                password: "password123",
                fullname: "Registered User",
            })
                .expect(201);
            expect(response.body.user.username).toBe(username);
            expect(response.body.user.password).toBeUndefined();
            expect(await User.findOne({ username })).toBeTruthy();
        });
        it("400 when validation fails", async () => {
            const response = await request(app)
                .post("/api/auth/register")
                .send({ username: "only-username" })
                .expect(400);
            expect(response.body.message).toBe("Validation error");
        });
    });
    describe("GET /api/auth/users", () => {
        it("401 without auth token", async () => {
            await request(app).get("/api/auth/users").expect(401);
        });
        it("403 for USER role", async () => {
            await request(app)
                .get("/api/auth/users")
                .set(createAuthHeader(RoleType.USER))
                .expect(403);
        });
        it("200 returns users for ADMIN", async () => {
            await createTestUser({ username: `listed-${Date.now()}` });
            const response = await request(app)
                .get("/api/auth/users")
                .set(createAuthHeader(RoleType.ADMIN))
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThanOrEqual(1);
        });
    });
    describe("GET /api/auth/me/:id", () => {
        it("200 returns user profile for authenticated USER", async () => {
            const user = await createTestUser({ username: `me-${Date.now()}` });
            const response = await request(app)
                .get(`/api/auth/me/${user._id.toString()}`)
                .set(createAuthHeader(RoleType.USER, user._id.toString()))
                .expect(200);
            expect(response.body.user._id.toString()).toBe(user._id.toString());
            expect(response.body.user.password).toBeUndefined();
        });
    });
    describe("GET /api/auth/roles", () => {
        it("200 returns roles for ADMIN", async () => {
            await Role.create({ value: "USER", name: "User" });
            await Role.create({ value: "ADMIN", name: "Admin" });
            const response = await request(app)
                .get("/api/auth/roles")
                .set(createAuthHeader(RoleType.ADMIN))
                .expect(200);
            expect(response.body).toHaveLength(2);
        });
    });
    describe("POST /api/auth/users", () => {
        it("403 for ADMIN role", async () => {
            await request(app)
                .post("/api/auth/users")
                .set(createAuthHeader(RoleType.ADMIN))
                .send({
                username: `prime-only-${Date.now()}`,
                password: "password123",
                fullname: "Prime Only",
            })
                .expect(403);
        });
        it("201 creates user for PRIME", async () => {
            const username = `prime-create-${Date.now()}`;
            const response = await request(app)
                .post("/api/auth/users")
                .set(createAuthHeader(RoleType.PRIME))
                .send({
                username,
                password: "password123",
                fullname: "Created By Prime",
            })
                .expect(201);
            expect(response.body.user.username).toBe(username);
        });
    });
});
