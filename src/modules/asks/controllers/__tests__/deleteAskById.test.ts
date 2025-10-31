import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";

import { deleteAskById } from "../delete-ask-by-id/deleteAskById.js";
import { createTestAsk } from "../../../../test/setup.js";

describe("deleteAskById", () => {
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

  it("200: удаляет заявку и возвращает подтверждение", async () => {
    const ask = await createTestAsk({ artikul: "ART-X" });
    const req = { params: { id: String(ask._id) } } as unknown as Request;
    await deleteAskById(req, res);
    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Ask deleted successfully");
    expect(responseJson.data.id).toBe(String(ask._id));
    expect(responseJson.data.artikul).toBe("ART-X");
  });

  it("404: ask не найден", async () => {
    const req = { params: { id: new mongoose.Types.ObjectId().toString() } } as unknown as Request;
    await deleteAskById(req, res);
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Ask not found");
  });

  it("400: ошибка валидации", async () => {
    const req = { params: { id: "invalid" } } as unknown as Request;
    await deleteAskById(req, res);
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });
});


