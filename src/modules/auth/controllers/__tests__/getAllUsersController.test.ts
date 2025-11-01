import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { getAllUsersController } from "../get-all-users/getAllUsersController.js";

describe("getAllUsersController", () => {
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

  it("200: возвращает всех пользователей без паролей", async () => {
    await createTestUser({ username: `user1-${Date.now()}` });
    await createTestUser({ username: `user2-${Date.now()}` });

    const req = {} as unknown as Request;

    await getAllUsersController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(Array.isArray(responseJson)).toBe(true);
    expect(responseJson.length).toBe(2);
    responseJson.forEach((user: any) => {
      expect(user.password).toBeUndefined();
      expect(user._id).toBeDefined();
    });
  });

  it("200: возвращает пустой массив если пользователей нет", async () => {
    const req = {} as unknown as Request;

    await getAllUsersController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(Array.isArray(responseJson)).toBe(true);
    expect(responseJson.length).toBe(0);
  });
});

