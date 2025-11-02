import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestPallet } from "../../../../test/utils/testHelpers.js";
import { getPalletByIdController } from "../get-pallet-by-id/getPalletByIdController.js";

describe("getPalletByIdController", () => {
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

  it("200: возвращает exists=true и данные при наличии паллеты", async () => {
    const pallet = await createTestPallet({ title: "Pallet-1" });
    const req = {
      params: { id: String(pallet._id) },
    } as unknown as Request;

    await getPalletByIdController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(true);
    expect(responseJson.message).toBe("Pallet retrieved successfully");
    expect(responseJson.data.title).toBe("Pallet-1");
  });

  it("200: возвращает exists=false при отсутствии паллеты", async () => {
    const req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
    } as unknown as Request;

    await getPalletByIdController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(false);
    expect(responseJson.message).toBe("Pallet not found");
    expect(responseJson.data).toBeNull();
  });

  it("400: ошибка валидации при невалидном id", async () => {
    const req = { params: { id: "invalid-id" } } as unknown as Request;

    await getPalletByIdController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });
});






