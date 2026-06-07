import jwt from "jsonwebtoken";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { checkAuth } from "../checkAuth.js";
import { createMockRequest, createMockResponse } from "../../test/utils/testHelpers.js";

describe("checkAuth", () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it("returns 401 when Authorization header is missing", () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    checkAuth(req as any, res as any, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe("NO_TOKEN");
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for invalid token format", () => {
    const req = createMockRequest({
      headers: { authorization: "Token abc" },
    });
    const res = createMockResponse();
    const next = vi.fn();

    checkAuth(req as any, res as any, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe("INVALID_TOKEN_FORMAT");
  });

  it("returns 500 when JWT_SECRET is not configured", () => {
    delete process.env.JWT_SECRET;
    const req = createMockRequest({
      headers: { authorization: "Bearer sometoken" },
    });
    const res = createMockResponse();
    const next = vi.fn();

    checkAuth(req as any, res as any, next);

    expect(res.statusCode).toBe(500);
    expect(res.body.code).toBe("JWT_SECRET_NOT_CONFIGURED");
  });

  it("sets req.user and calls next for valid token", () => {
    const token = jwt.sign({ id: "user-1", role: "ADMIN" }, "test-secret");
    const req = createMockRequest({
      headers: { authorization: `Bearer ${token}` },
    });
    const res = createMockResponse();
    const next = vi.fn();

    checkAuth(req as any, res as any, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toEqual({ id: "user-1", role: "ADMIN" });
  });

  it("returns 401 for expired token", () => {
    const token = jwt.sign({ id: "user-1", role: "USER" }, "test-secret", {
      expiresIn: "-1s",
    });
    const req = createMockRequest({
      headers: { authorization: `Bearer ${token}` },
    });
    const res = createMockResponse();
    const next = vi.fn();

    checkAuth(req as any, res as any, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe("TOKEN_EXPIRED");
  });

  it("returns 401 for invalid token payload without id", () => {
    const token = jwt.sign({ role: "USER" }, "test-secret");
    const req = createMockRequest({
      headers: { authorization: `Bearer ${token}` },
    });
    const res = createMockResponse();
    const next = vi.fn();

    checkAuth(req as any, res as any, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe("INVALID_TOKEN_PAYLOAD");
  });
});
