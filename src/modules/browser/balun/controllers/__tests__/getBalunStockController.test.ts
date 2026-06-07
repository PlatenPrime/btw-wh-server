import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getBalunStockController } from "../getBalunStockController.js";
import { getBalunStockData } from "../../utils/getBalunStockData.js";

vi.mock("../../utils/getBalunStockData.js");

describe("getBalunStockController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(() => {
    vi.mocked(getBalunStockData).mockReset();
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

  it("400 when link invalid (empty)", async () => {
    const req = { query: { link: "" } } as unknown as Request;
    await getBalunStockController(req, res);
    expect(responseStatus.code).toBe(400);
    expect(getBalunStockData).not.toHaveBeenCalled();
  });

  it("404 when product not found", async () => {
    vi.mocked(getBalunStockData).mockResolvedValue({ stock: -1, price: -1 });
    const req = {
      query: { link: "https://balun.example/product/1" },
    } as unknown as Request;

    await getBalunStockController(req, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Товар не найден или данные недоступны");
  });

  it("200 returns stock data", async () => {
    const mockData = { stock: 5, price: 99.9, title: "Balun product" };
    vi.mocked(getBalunStockData).mockResolvedValue(mockData);

    const req = {
      query: { link: "https://balun.example/product/2" },
    } as unknown as Request;

    await getBalunStockController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Balun stock retrieved successfully");
    expect(responseJson.data).toEqual(mockData);
  });

  it("500 when service throws", async () => {
    vi.mocked(getBalunStockData).mockRejectedValue(new Error("Service error"));

    const req = {
      query: { link: "https://balun.example/product/3" },
    } as unknown as Request;

    await getBalunStockController(req, res);

    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
  });
});
