import jwt from "jsonwebtoken";
import { afterEach, describe, expect, it } from "vitest";
import { RoleType } from "../../../../constants/roles.js";
import { generateAccessToken } from "../generateAccessToken.js";

describe("generateAccessToken", () => {
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it("генерирует JWT токен с id и role", () => {
    process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only";
    const userId = "507f1f77bcf86cd799439011";

    const token = generateAccessToken(userId, RoleType.USER);

    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as jwt.JwtPayload;

    expect(decoded.id).toBe(userId);
    expect(decoded.role).toBe(RoleType.USER);
  });

  it("принимает кастомный expiresIn", () => {
    process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only";
    const token = generateAccessToken("user-id", RoleType.ADMIN, "1h");
    const decoded = jwt.decode(token) as jwt.JwtPayload;

    expect(decoded.role).toBe(RoleType.ADMIN);
    expect(decoded.exp).toBeDefined();
  });

  it("бросает ошибку если JWT_SECRET не задан", () => {
    delete process.env.JWT_SECRET;

    expect(() => generateAccessToken("user-id", RoleType.USER)).toThrow(
      "JWT_SECRET is not defined in environment variables"
    );
  });
});
