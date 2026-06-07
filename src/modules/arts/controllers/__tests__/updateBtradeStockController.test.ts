import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as updateUtil from "../../utils/updateBtradeStockUtil.js";
import { updateBtradeStockController } from "../update-btrade-stock/updateBtradeStockController.js";

describe("updateBtradeStockController", () => {
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

  it("200: обновляет btradeStock", async () => {
    const updatedArt = { artikul: "ART-001", btradeStock: { value: 5 } };
    vi.spyOn(updateUtil, "updateBtradeStockUtil").mockResolvedValue(
      updatedArt as any
    );

    const req = { params: { artikul: "ART-001" } } as unknown as Request;

    await updateBtradeStockController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("BtradeStock updated successfully");
    expect(responseJson.data).toEqual(updatedArt);
  });

  it("404: артикул не найден или нет данных на sharik.ua", async () => {
    vi.spyOn(updateUtil, "updateBtradeStockUtil").mockResolvedValue(null);

    const req = { params: { artikul: "MISSING" } } as unknown as Request;

    await updateBtradeStockController(req, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe(
      "Art not found or product not found on sharik.ua"
    );
  });

  it("400: ошибка валидации при пустом artikul", async () => {
    const req = { params: { artikul: "" } } as unknown as Request;

    await updateBtradeStockController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });

  it("500: обрабатывает ошибки util", async () => {
    vi.spyOn(updateUtil, "updateBtradeStockUtil").mockRejectedValue(
      new Error("Server failure")
    );

    const req = { params: { artikul: "ART-ERR" } } as unknown as Request;

    await updateBtradeStockController(req, res);

    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
  });
});
