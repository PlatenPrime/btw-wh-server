import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSvbumStockController } from "../getSvbumStockController.js";
import { getSvbumStockData } from "../../utils/getSvbumStockData.js";

vi.mock("../../utils/getSvbumStockData.js");

describe("getSvbumStockController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(() => {
    vi.mocked(getSvbumStockData).mockReset();
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
    await getSvbumStockController(req, res);
    expect(responseStatus.code).toBe(400);
    expect(getSvbumStockData).not.toHaveBeenCalled();
  });

  it("404 when product not found", async () => {
    vi.mocked(getSvbumStockData).mockResolvedValue({ stock: -1, price: -1 });
    const req = {
      query: { link: "https://example.com/product/1" },
    } as unknown as Request;

    await getSvbumStockController(req, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Товар не найден или данные недоступны");
    expect(getSvbumStockData).toHaveBeenCalledWith(
      "https://example.com/product/1"
    );
  });

  it("200 returns stock data", async () => {
    const mockData = {
      stock: 300,
      price: 3.93,
      title: "Латексні кульки",
    };
    vi.mocked(getSvbumStockData).mockResolvedValue(mockData);

    const req = {
      query: { link: "https://sviatobum.ua/product/2" },
    } as unknown as Request;

    await getSvbumStockController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Svbum stock retrieved successfully");
    expect(responseJson.data).toEqual(mockData);
    expect(getSvbumStockData).toHaveBeenCalledWith(
      "https://sviatobum.ua/product/2"
    );
  });

  it("500 when service throws", async () => {
    vi.mocked(getSvbumStockData).mockRejectedValue(new Error("Service error"));

    const req = {
      query: { link: "https://example.com/product/3" },
    } as unknown as Request;

    await getSvbumStockController(req, res);

    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
  });
});
