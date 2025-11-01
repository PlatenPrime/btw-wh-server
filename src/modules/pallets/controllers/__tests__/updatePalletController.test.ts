import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestRow, createTestPallet } from "../../../../test/utils/testHelpers.js";
import { updatePalletController } from "../update-pallet/updatePalletController.js";

describe("updatePalletController", () => {
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

  it("200: обновляет паллету", async () => {
    const pallet = await createTestPallet({ title: "Old-Pallet", sector: "A" });

    const req = {
      params: { id: String(pallet._id) },
      body: {
        title: "New-Pallet",
        sector: "B",
      },
    } as unknown as Request;

    await updatePalletController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.title).toBe("New-Pallet");
    expect(responseJson.sector).toBe("B");
  });

  it("404: если паллета не найдена", async () => {
    const req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
      body: { title: "New-Pallet" },
    } as unknown as Request;

    await updatePalletController(req, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Pallet not found");
  });

  it("400: ошибка валидации при невалидном id", async () => {
    const req = {
      params: { id: "invalid-id" },
      body: { title: "New-Pallet" },
    } as unknown as Request;

    await updatePalletController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });
});




