import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";

import { createTestAsk, createTestUser } from "../../../../test/setup.js";
import { updateAskById } from "../update-ask-by-id/updateAskById.js";

describe("updateAskById", () => {
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

  it("200: обновляет заявку, добавляя действие и статус", async () => {
    const ask = await createTestAsk({ actions: [], status: "new" });
    const solver = await createTestUser({ fullname: "Solver" });
    const req = {
      params: { id: String(ask._id) },
      body: {
        solverId: String(solver._id),
        action: "коментар",
        status: "completed",
      },
    } as unknown as Request;

    await updateAskById(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.status).toBe("completed");
    expect(responseJson.solverData.fullname).toBe("Solver");
    expect(responseJson.actions.at(-1)).toContain("коментар");
  });

  it("200: создаёт pull событие при обновлении", async () => {
    const ask = await createTestAsk({ actions: [], status: "new" });
    const solver = await createTestUser({ fullname: "Solver" });
    const palletId = new mongoose.Types.ObjectId();
    const req = {
      params: { id: String(ask._id) },
      body: {
        solverId: String(solver._id),
        action: "знято з палети",
        event: {
          eventName: "pull",
          pullDetails: {
            palletData: {
              _id: palletId.toString(),
              title: "PAL-1",
            },
            quant: 5,
            boxes: 2,
          },
        },
      },
    } as unknown as Request;

    await updateAskById(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.events.at(-1).eventName).toBe("pull");
    expect(responseJson.events.at(-1).pullDetails.quant).toBe(5);
    expect(
      responseJson.events.at(-1).pullDetails.palletData._id.toString()
    ).toBe(palletId.toString());
    expect(responseJson.pullQuant).toBe(5);
    expect(responseJson.pullBox).toBe(2);
  });

  it("404: ask не найден", async () => {
    const solver = await createTestUser();
    const req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
      body: { solverId: String(solver._id), action: "a" },
    } as unknown as Request;
    await updateAskById(req, res);
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Ask not found");
  });

  it("404: solver не найден", async () => {
    const ask = await createTestAsk();
    const req = {
      params: { id: String(ask._id) },
      body: { solverId: new mongoose.Types.ObjectId().toString(), action: "a" },
    } as unknown as Request;
    await updateAskById(req, res);
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Solver user not found");
  });

  it("400: ошибка валидации", async () => {
    const req = {
      params: { id: "invalid" },
      body: { solverId: "invalid", action: 1 },
    } as unknown as Request;
    await updateAskById(req, res);
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });
});
