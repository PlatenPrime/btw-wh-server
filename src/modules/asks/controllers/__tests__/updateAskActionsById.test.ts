import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";

import { updateAskActionsById } from "../update-ask-actions-by-id/updateAskActionsById.js";
import { createTestAsk, createTestUser } from "../../../../test/setup.js";

describe("updateAskActionsById", () => {
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
    } as unknown as Response;
  });

  it("200: добавляет действие", async () => {
    const ask = await createTestAsk({ actions: [] });
    const user = await createTestUser({ fullname: "User" });
    const req = {
      params: { id: String(ask._id) },
      body: { userId: String(user._id), action: "note" },
    } as unknown as Request;
    await updateAskActionsById(req, res);
    expect(responseStatus.code).toBe(200);
    expect(responseJson.actions.at(-1)).toContain("note");
  });

  it("404: ask не найден", async () => {
    const user = await createTestUser();
    const req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
      body: { userId: String(user._id), action: "note" },
    } as unknown as Request;
    await updateAskActionsById(req, res);
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Ask not found");
  });

  it("404: user не найден", async () => {
    const ask = await createTestAsk();
    const req = {
      params: { id: String(ask._id) },
      body: { userId: new mongoose.Types.ObjectId().toString(), action: "note" },
    } as unknown as Request;
    await updateAskActionsById(req, res);
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("User not found");
  });

  it("400: ошибка валидации", async () => {
    const req = { params: { id: "invalid" }, body: { userId: "invalid", action: 1 } } as unknown as Request;
    await updateAskActionsById(req, res);
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });
});


