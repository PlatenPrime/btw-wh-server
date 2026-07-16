import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
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

  it("201: создаёт audit-событие когда req.user присутствует", async () => {
    const actor = await createTestUser({ username: `actor-${Date.now()}` });
    const newUsername = `newuser-${Date.now()}`;
    const req = {
      user: { id: actor._id.toString(), role: "ADMIN" },
      body: {
        username: newUsername,
        password: "password123",
        fullname: "New User",
        role: "ADMIN",
      },
    } as unknown as Request;

    await createUserController(req, res);

    expect(responseStatus.code).toBe(201);
    const events = await Event.find({ department: "auth" });
    expect(events).toHaveLength(1);
    expect(events[0].userId.toString()).toBe(actor._id.toString());
    expect(events[0].description).toContain(newUsername);
    expect(events[0].description).not.toContain("password123");
  });

  it("201: не создаёт audit-событие без req.user", async () => {
    const req = {
      body: {
        username: `newuser-${Date.now()}`,
        password: "password123",
        fullname: "New User",
      },
    } as unknown as Request;

    await createUserController(req, res);

    expect(responseStatus.code).toBe(201);
    const events = await Event.find({ department: "auth" });
    expect(events).toHaveLength(0);
  });
});
