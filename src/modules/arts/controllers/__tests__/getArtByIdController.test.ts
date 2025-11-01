import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestArt } from "../../../../test/setup.js";
import { getArtByIdController } from "../get-art-by-id/getArtByIdController.js";

describe("getArtByIdController", () => {
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

  it("200: возвращает артикул по валидному ObjectId", async () => {
    const testArt = await createTestArt({
      artikul: "ART-001",
      nameukr: "Test Art",
      zone: "A1",
    });

    const req = { params: { id: testArt._id.toString() } } as unknown as Request;

    await getArtByIdController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(true);
    expect(responseJson.message).toBe("Art retrieved successfully");
    expect(responseJson.data.artikul).toBe("ART-001");
    expect(responseJson.data._id).toBeDefined();
  });

  it("200: возвращает exists false если артикул не найден", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const req = { params: { id: nonExistentId.toString() } } as unknown as Request;

    await getArtByIdController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(false);
    expect(responseJson.message).toBe("Art not found");
    expect(responseJson.data).toBe(null);
  });

  it("400: ошибка валидации при невалидном формате ObjectId", async () => {
    const req = { params: { id: "invalid-id-format" } } as unknown as Request;

    await getArtByIdController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Invalid art ID format");
  });
});

