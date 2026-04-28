import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPerfectStockController } from "../getPerfectStockController.js";
import { getPerfectStockData } from "../../utils/getPerfectStockData.js";

vi.mock("../../utils/getPerfectStockData.js");

describe("getPerfectStockController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(() => {
    vi.mocked(getPerfectStockData).mockReset();
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
    await getPerfectStockController(req, res);
    expect(responseStatus.code).toBe(400);
    expect(getPerfectStockData).not.toHaveBeenCalled();
  });

  it("404 when product not found", async () => {
    vi.mocked(getPerfectStockData).mockResolvedValue({ stock: -1, price: -1 });
    const req = {
      query: { link: "https://perfectparty.in.ua/product/16467" },
    } as unknown as Request;

    await getPerfectStockController(req, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Товар не найден или данные недоступны");
    expect(getPerfectStockData).toHaveBeenCalledWith(
      "https://perfectparty.in.ua/product/16467"
    );
  });

  it("200 returns stock data", async () => {
    const mockData = {
      stock: 90,
      price: 4.5,
      title: "Кулька 10 шт. в уп.",
    };
    vi.mocked(getPerfectStockData).mockResolvedValue(mockData);
    const req = {
      query: { link: "https://perfectparty.in.ua/product/16467" },
    } as unknown as Request;

    await getPerfectStockController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Perfect stock retrieved successfully");
    expect(responseJson.data).toEqual(mockData);
  });

  it("500 when service throws", async () => {
    vi.mocked(getPerfectStockData).mockRejectedValue(new Error("Service error"));
    const req = {
      query: { link: "https://perfectparty.in.ua/product/16467" },
    } as unknown as Request;

    await getPerfectStockController(req, res);

    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
  });
});
