import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { getUserByIdController } from "../get-user-by-id/getUserByIdController.js";

describe("getUserByIdController", () => {
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

  it("200: возвращает пользователя без пароля", async () => {
    const user = await createTestUser({
      username: `testuser-${Date.now()}`,
      fullname: "Test User",
    });

    const req = {
      params: {
        id: user._id.toString(),
      },
    } as unknown as Request;

    await getUserByIdController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.user).toBeTruthy();
    expect(responseJson.user._id.toString()).toBe(user._id.toString());
    expect((responseJson.user as any).password).toBeUndefined();
  });

  it("400: ошибка валидации при невалидном ID", async () => {
    const req = {
      params: {
        id: "invalid-id",
      },
    } as unknown as Request;

    await getUserByIdController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });

  it("404: пользователь не найден", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const req = {
      params: {
        id: fakeId,
      },
    } as unknown as Request;

    await getUserByIdController(req, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Користувач не знайдений");
  });
});

