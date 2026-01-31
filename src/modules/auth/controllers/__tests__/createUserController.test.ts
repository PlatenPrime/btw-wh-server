import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { createUserController } from "../create-user/createUserController.js";

describe("createUserController", () => {
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

  it("201: создаёт пользователя с обязательными полями", async () => {
    const req = {
      body: {
        username: `newuser-${Date.now()}`,
        password: "password123",
        fullname: "New User",
      },
    } as unknown as Request;

    await createUserController(req, res);

    expect(responseStatus.code).toBe(201);
    expect(responseJson.user).toBeTruthy();
    expect(responseJson.user.username).toBe(req.body.username);
    expect(responseJson.user.fullname).toBe(req.body.fullname);
    expect((responseJson.user as any).password).toBeUndefined();
  });

  it("201: создаёт пользователя с опциональными полями role, telegram, photo", async () => {
    const req = {
      body: {
        username: `newuser-${Date.now()}`,
        password: "password123",
        fullname: "New User",
        role: "ADMIN",
        telegram: "@user",
        photo: "https://example.com/photo.jpg",
      },
    } as unknown as Request;

    await createUserController(req, res);

    expect(responseStatus.code).toBe(201);
    expect(responseJson.user).toBeTruthy();
    expect(responseJson.user.telegram).toBe("@user");
    expect(responseJson.user.photo).toBe("https://example.com/photo.jpg");
    expect((responseJson.user as any).password).toBeUndefined();
  });

  it("409: username уже существует", async () => {
    const existing = await createTestUser({ username: `existing-${Date.now()}` });
    const req = {
      body: {
        username: existing.username,
        password: "password123",
        fullname: "Another User",
      },
    } as unknown as Request;

    await createUserController(req, res);

    expect(responseStatus.code).toBe(409);
    expect(responseJson.message).toMatch(/username|існує|уже/i);
  });

  it("400: ошибка валидации при отсутствии username", async () => {
    const req = {
      body: {
        password: "password123",
        fullname: "New User",
      },
    } as unknown as Request;

    await createUserController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });

  it("400: ошибка валидации при отсутствии password", async () => {
    const req = {
      body: {
        username: `user-${Date.now()}`,
        fullname: "New User",
      },
    } as unknown as Request;

    await createUserController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });

  it("400: ошибка валидации при отсутствии fullname", async () => {
    const req = {
      body: {
        username: `user-${Date.now()}`,
        password: "password123",
      },
    } as unknown as Request;

    await createUserController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });
});
