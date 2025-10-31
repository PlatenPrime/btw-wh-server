import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../reject-ask-by-id/utils/sendRejectAskMesUtil.js", () => ({
  sendRejectAskMesUtil: vi.fn().mockResolvedValue(undefined),
}));

import { rejectAskById } from "../reject-ask-by-id/rejectAskById.js";
import { createTestAsk, createTestUser } from "../../../../test/setup.js";

describe("rejectAskById", () => {
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

  it("200: отклоняет заявку", async () => {
    const asker = await createTestUser({ telegram: "321", username: `asker-${Date.now()}-${Math.random()}` });
    const ask = await createTestAsk({ asker: asker._id, askerData: { _id: asker._id, fullname: asker.fullname, telegram: asker.telegram, photo: asker.photo } });
    const solver = await createTestUser({ fullname: "Solver", username: `solver-${Date.now()}-${Math.random()}` });

    const req = {
      params: { id: String(ask._id) },
      body: { solverId: String(solver._id) },
    } as unknown as Request;

    await rejectAskById(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.status).toBe("rejected");
    expect(responseJson.solverData.fullname).toBe("Solver");
  });

  it("404: ask не найден", async () => {
    const solver = await createTestUser();
    const req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
      body: { solverId: String(solver._id) },
    } as unknown as Request;
    await rejectAskById(req, res);
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Ask not found");
  });

  it("404: solver не найден", async () => {
    const ask = await createTestAsk();
    const req = {
      params: { id: String(ask._id) },
      body: { solverId: new mongoose.Types.ObjectId().toString() },
    } as unknown as Request;
    await rejectAskById(req, res);
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Solver user not found");
  });

  it("400: ошибка валидации", async () => {
    const req = { params: { id: "invalid" }, body: { solverId: "invalid" } } as unknown as Request;
    await rejectAskById(req, res);
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });
});


