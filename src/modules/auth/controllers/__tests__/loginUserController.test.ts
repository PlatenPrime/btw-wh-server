import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { hashPasswordUtil } from "../../utils/hashPasswordUtil.js";
import { loginUserController } from "../login-user/loginUserController.js";

describe("loginUserController", () => {
  let res: Response;
  let responseJson: any;
  let responseStatus: any;

  beforeEach(() => {
    responseJson = {};
    responseStatus = {};
    res = {
      status: function (code: number) {
        responseStatus.code = code;
        return this;
      },
      json: function (data: any) {
        responseJson = data;
        return this;
      },
      headersSent: false,
    } as unknown as Response;
    vi.clearAllMocks();
  });

  it("200: успешный логин", async () => {
    const password = "correctPassword";
    const hashedPassword = hashPasswordUtil(password);
    const user = await createTestUser({
      username: `testuser-${Date.now()}`,
      password: hashedPassword,
      fullname: "Test User",
    });

    const req = {
      body: {
        username: user.username,
        password: password,
      },
    } as unknown as Request;

    await loginUserController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.user).toBeTruthy();
    expect(responseJson.user._id.toString()).toBe(user._id.toString());
    expect(responseJson.token).toBeTruthy();
    expect((responseJson.user as any).password).toBeUndefined();
  });

  it("400: ошибка валидации при отсутствии username", async () => {
    const req = {
      body: {
        password: "password123",
      },
    } as unknown as Request;

    await loginUserController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });

  it("400: пользователь не найден", async () => {
    const req = {
      body: {
        username: "nonexistent",
        password: "password123",
      },
    } as unknown as Request;

    await loginUserController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toContain("не знайдений");
  });

  it("400: неверный пароль", async () => {
    const password = "correctPassword";
    const hashedPassword = hashPasswordUtil(password);
    const user = await createTestUser({
      username: `testuser-${Date.now()}`,
      password: hashedPassword,
    });

    const req = {
      body: {
        username: user.username,
        password: "wrongPassword",
      },
    } as unknown as Request;

    await loginUserController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Пароль не вірний");
  });
});

