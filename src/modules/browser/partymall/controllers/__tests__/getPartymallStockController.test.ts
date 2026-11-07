import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPartymallStockController } from "../getPartymallStockController.js";
import { getPartymallStockData } from "../../utils/getPartymallStockData.js";

vi.mock("../../utils/getPartymallStockData.js");

describe("getPartymallStockController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(() => {
    vi.mocked(getPartymallStockData).mockReset();
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
    await getPartymallStockController(req, res);
    expect(responseStatus.code).toBe(400);
    expect(getPartymallStockData).not.toHaveBeenCalled();
  });

  it("404 when product not found", async () => {
    vi.mocked(getPartymallStockData).mockResolvedValue({ stock: -1, price: -1 });
    const req = {
      query: { link: "https://example.com/product/1" },
    } as unknown as Request;

    await getPartymallStockController(req, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Товар не найден или данные недоступны");
    expect(getPartymallStockData).toHaveBeenCalledWith("https://example.com/product/1");
  });

  it("200 returns stock data", async () => {
    const mockData = {
      stock: 23,
      price: 1.7,
      title: "Повітряні кулі",
      artikul: "G90 01",
    };
    vi.mocked(getPartymallStockData).mockResolvedValue(mockData);

    const req = {
      query: {
        link: "https://partymall.ua/vozdushnyje-shary-pastjel-bjelyj-10-25-sm-gemar",
      },
    } as unknown as Request;

    await getPartymallStockController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Partymall stock retrieved successfully");
    expect(responseJson.data).toEqual(mockData);
    expect(getPartymallStockData).toHaveBeenCalledWith(
      "https://partymall.ua/vozdushnyje-shary-pastjel-bjelyj-10-25-sm-gemar",
    );
  });

  it("500 when service throws", async () => {
    vi.mocked(getPartymallStockData).mockRejectedValue(new Error("Service error"));

    const req = {
      query: { link: "https://example.com/product/3" },
    } as unknown as Request;

    await getPartymallStockController(req, res);

    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
  });
});
