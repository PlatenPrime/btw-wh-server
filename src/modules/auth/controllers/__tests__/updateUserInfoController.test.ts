import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { hashPasswordUtil } from "../../utils/hashPasswordUtil.js";
import { updateUserInfoController } from "../update-user-info/updateUserInfoController.js";

describe("updateUserInfoController", () => {
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

  it("200: обновляет пользователя", async () => {
    const user = await createTestUser({
      username: `testuser-${Date.now()}`,
      fullname: "Old Name",
    });

    const req = {
      params: {
        userId: user._id.toString(),
      },
      body: {
        fullname: "New Name",
        role: "ADMIN",
      },
    } as unknown as Request;

    await updateUserInfoController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.user).toBeTruthy();
    expect(responseJson.user.fullname).toBe("New Name");
    expect(responseJson.user.role).toBe("ADMIN");
    expect(responseJson.token).toBeTruthy();
    expect((responseJson.user as any).password).toBeUndefined();
  });

  it("200: обновляет пароль если он передан", async () => {
    const oldPassword = hashPasswordUtil("oldPassword");
    const user = await createTestUser({
      username: `testuser-${Date.now()}`,
      password: oldPassword,
    });

    const req = {
      params: {
        userId: user._id.toString(),
      },
      body: {
        password: "newPassword123",
      },
    } as unknown as Request;

    await updateUserInfoController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.user).toBeTruthy();
    expect((responseJson.user as any).password).toBeUndefined();
  });

  it("400: ошибка валидации при невалидном userId", async () => {
    const req = {
      params: {
        userId: "invalid-id",
      },
      body: {
        fullname: "New Name",
      },
    } as unknown as Request;

    await updateUserInfoController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });

  it("404: пользователь не найден", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const req = {
      params: {
        userId: fakeId,
      },
      body: {
        fullname: "New Name",
      },
    } as unknown as Request;

    await updateUserInfoController(req, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Користувач не знайдений");
  });
});

