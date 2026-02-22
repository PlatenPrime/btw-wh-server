import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getBtradeArtInfoController } from "../get-btrade-art-info/getBtradeArtInfoController.js";
import * as utils from "../../../../utils/index.js";

describe("getBtradeArtInfoController", () => {
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
    vi.clearAllMocks();
  });

  it("200: возвращает данные из внешнего API", async () => {
    const mockData = {
      nameukr: "Тест товар",
      price: 100,
      quantity: 10,
    };

    vi.spyOn(utils, "getSharikStockData").mockResolvedValue(mockData);

    const req = { params: { artikul: "TEST-001" } } as unknown as Request;

    await getBtradeArtInfoController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson).toEqual({
      exists: true,
      message: "Product info retrieved successfully",
      data: mockData,
    });
  });

  it("200: возвращает exists false если товар не найден", async () => {
    vi.spyOn(utils, "getSharikStockData").mockResolvedValue(null);

    const req = { params: { artikul: "NONEXISTENT" } } as unknown as Request;

    await getBtradeArtInfoController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson).toEqual({
      exists: false,
      message: "No products found for this artikul",
      data: null,
    });
  });

  it("400: ошибка валидации при пустом artikul", async () => {
    const req = { params: { artikul: "" } } as unknown as Request;

    await getBtradeArtInfoController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Artikul is required");
  });

  it("500: обрабатывает ошибки API", async () => {
    vi.spyOn(utils, "getSharikStockData").mockRejectedValue(new Error("Network error"));

    const req = { params: { artikul: "ERROR-ART" } } as unknown as Request;

    await getBtradeArtInfoController(req, res);

    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Failed to fetch data from sharik.ua");
  });
});

