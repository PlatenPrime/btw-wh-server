import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDojdevikStockController } from "../getDojdevikStockController.js";
import { getDojdevikStockData } from "../../utils/getDojdevikStockData.js";

vi.mock("../../utils/getDojdevikStockData.js");

describe("getDojdevikStockController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(() => {
    vi.mocked(getDojdevikStockData).mockReset();
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
    await getDojdevikStockController(req, res);
    expect(responseStatus.code).toBe(400);
    expect(getDojdevikStockData).not.toHaveBeenCalled();
  });

  it("404 when product not found", async () => {
    vi.mocked(getDojdevikStockData).mockResolvedValue({ stock: -1, price: -1 });
    const req = {
      query: { link: "https://dojdevik.example/product/1" },
    } as unknown as Request;

    await getDojdevikStockController(req, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Товар не найден или данные недоступны");
  });

  it("200 returns stock data", async () => {
    const mockData = { stock: 3500, price: 1.7, title: "Dojdevik product" };
    vi.mocked(getDojdevikStockData).mockResolvedValue(mockData);

    const req = {
      query: { link: "https://dojdevik.example/product/2" },
    } as unknown as Request;

    await getDojdevikStockController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Dojdevik stock retrieved successfully");
    expect(responseJson.data).toEqual(mockData);
  });

  it("500 when service throws", async () => {
    vi.mocked(getDojdevikStockData).mockRejectedValue(new Error("Service error"));

    const req = {
      query: { link: "https://dojdevik.example/product/3" },
    } as unknown as Request;

    await getDojdevikStockController(req, res);

    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
  });
});
