import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSharikStockController } from "../getSharikStockController.js";
import { getSharikStockData } from "../../utils/getSharikStockData.js";

vi.mock("../../utils/getSharikStockData.js");

describe("getSharikStockController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(() => {
    vi.mocked(getSharikStockData).mockReset();
    responseJson = {};
    responseStatus = {};
    res = {
      status(code: number) {
        responseStatus.code = code;
        return this;
      },
      json(data: unknown) {
        responseJson = data as Record<string, unknown>;
        return this;
      },
      headersSent: false,
    } as unknown as Response;
  });

  it("400 when artikul invalid (empty)", async () => {
    const req = { params: { artikul: "" } } as unknown as Request;
    await getSharikStockController(req, res);
    expect(responseStatus.code).toBe(400);
    expect(getSharikStockData).not.toHaveBeenCalled();
  });

  it("404 when product not found", async () => {
    vi.mocked(getSharikStockData).mockResolvedValue(null);
    const req = { params: { artikul: "ART-1" } } as unknown as Request;
    await getSharikStockController(req, res);
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Товар не найден");
  });

  it("200 returns stock data", async () => {
    const mockData = {
      nameukr: "Товар",
      price: 100,
      quantity: 15,
    };
    vi.mocked(getSharikStockData).mockResolvedValue(mockData);
    const req = { params: { artikul: "ART-1" } } as unknown as Request;
    await getSharikStockController(req, res);
    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Sharik stock retrieved successfully");
    expect(responseJson.data).toEqual(mockData);
  });
});
