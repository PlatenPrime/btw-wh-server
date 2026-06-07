import { describe, expect, it, vi } from "vitest";
import { RoleType } from "../../constants/roles.js";
import { createMockRequest, createMockResponse } from "../../test/utils/testHelpers.js";
import { checkOwnership, checkRoles } from "../checkRoles.js";
describe("checkRoles", () => {
    it("returns 401 when req.user is missing", () => {
        const req = createMockRequest();
        const res = createMockResponse();
        const next = vi.fn();
        checkRoles([RoleType.ADMIN])(req, res, next);
        expect(res.statusCode).toBe(401);
        expect(res.body.code).toBe("USER_DATA_MISSING");
    });
    it("returns 403 for invalid user role", () => {
        const req = createMockRequest({ user: { id: "1", role: "UNKNOWN" } });
        const res = createMockResponse();
        const next = vi.fn();
        checkRoles([RoleType.USER])(req, res, next);
        expect(res.statusCode).toBe(403);
        expect(res.body.code).toBe("INVALID_USER_ROLE");
    });
    it("allows access when user role meets requirement", () => {
        const req = createMockRequest({ user: { id: "1", role: RoleType.ADMIN } });
        const res = createMockResponse();
        const next = vi.fn();
        checkRoles([RoleType.EDITOR])(req, res, next);
        expect(next).toHaveBeenCalledOnce();
    });
    it("returns 403 when user role is insufficient", () => {
        const req = createMockRequest({ user: { id: "1", role: RoleType.USER } });
        const res = createMockResponse();
        const next = vi.fn();
        checkRoles([RoleType.ADMIN])(req, res, next);
        expect(res.statusCode).toBe(403);
        expect(res.body.code).toBe("INSUFFICIENT_PERMISSIONS");
    });
});
describe("checkOwnership", () => {
    it("allows ADMIN without ownership check", async () => {
        const req = createMockRequest({ user: { id: "1", role: RoleType.ADMIN } });
        const res = createMockResponse();
        const next = vi.fn();
        const getUserId = vi.fn();
        await checkOwnership(getUserId)(req, res, next);
        expect(next).toHaveBeenCalledOnce();
        expect(getUserId).not.toHaveBeenCalled();
    });
    it("returns 403 when user is not owner", async () => {
        const req = createMockRequest({ user: { id: "1", role: RoleType.USER } });
        const res = createMockResponse();
        const next = vi.fn();
        await checkOwnership(async () => "other-user")(req, res, next);
        expect(res.statusCode).toBe(403);
        expect(res.body.code).toBe("NOT_RESOURCE_OWNER");
    });
    it("returns 404 when resource owner is not found", async () => {
        const req = createMockRequest({ user: { id: "1", role: RoleType.USER } });
        const res = createMockResponse();
        const next = vi.fn();
        await checkOwnership(async () => undefined)(req, res, next);
        expect(res.statusCode).toBe(404);
        expect(res.body.code).toBe("RESOURCE_NOT_FOUND");
    });
    it("allows owner access", async () => {
        const req = createMockRequest({ user: { id: "1", role: RoleType.USER } });
        const res = createMockResponse();
        const next = vi.fn();
        await checkOwnership(async () => "1")(req, res, next);
        expect(next).toHaveBeenCalledOnce();
    });
});
