import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestPallet } from "../../../../test/utils/testHelpers.js";
import { deletePalletController } from "../delete-pallet/deletePalletController.js";

describe("deletePalletController", () => {
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

  it("200: удаляет паллету", async () => {
    const pallet = await createTestPallet({ title: "Pallet-To-Delete" });
    const req = {
      params: { id: String(pallet._id) },
    } as unknown as Request;

    await deletePalletController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Pallet deleted");
  });

  it("404: если паллета не найдена", async () => {
    const req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
    } as unknown as Request;

    await deletePalletController(req, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Pallet not found");
  });

  it("400: ошибка валидации при невалидном id", async () => {
    const req = { params: { id: "invalid-id" } } as unknown as Request;

    await deletePalletController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });
});






