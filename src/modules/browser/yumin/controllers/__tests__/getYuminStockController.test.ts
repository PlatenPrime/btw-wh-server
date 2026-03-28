import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getYuminStockController } from "../getYuminStockController.js";
import { getYuminStockData } from "../../utils/getYuminStockData.js";

vi.mock("../../utils/getYuminStockData.js");

describe("getYuminStockController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(() => {
    vi.mocked(getYuminStockData).mockReset();
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
    await getYuminStockController(req, res);
    expect(responseStatus.code).toBe(400);
    expect(getYuminStockData).not.toHaveBeenCalled();
  });

  it("404 when product not found", async () => {
    vi.mocked(getYuminStockData).mockResolvedValue({ stock: -1, price: -1 });
    const req = {
      query: { link: "https://example.com/product/1" },
    } as unknown as Request;

    await getYuminStockController(req, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Товар не найден или данные недоступны");
    expect(getYuminStockData).toHaveBeenCalledWith(
      "https://example.com/product/1"
    );
  });

  it("200 returns stock data", async () => {
    const mockData = {
      stock: 10,
      price: 2.5,
      title: "Test product",
    };
    vi.mocked(getYuminStockData).mockResolvedValue(mockData);

    const req = {
      query: { link: "https://example.com/product/2" },
    } as unknown as Request;

    await getYuminStockController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Yumin stock retrieved successfully");
    expect(responseJson.data).toEqual(mockData);
    expect(getYuminStockData).toHaveBeenCalledWith(
      "https://example.com/product/2"
    );
  });

  it("500 when service throws", async () => {
    vi.mocked(getYuminStockData).mockRejectedValue(new Error("Service error"));

    const req = {
      query: { link: "https://example.com/product/3" },
    } as unknown as Request;

    await getYuminStockController(req, res);

    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
  });
});
