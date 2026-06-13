import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getKonkProdManufacturersPieDataController } from "../getKonkProdManufacturersPieDataController.js";
import { getKonkProdManufacturersPieDataUtil } from "../utils/getKonkProdManufacturersPieDataUtil.js";

vi.mock("../utils/getKonkProdManufacturersPieDataUtil.js");

describe("getKonkProdManufacturersPieDataController", () => {
  let res: Response;
  let responseStatus: { code?: number };
  let responseJson: Record<string, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    responseStatus = {};
    responseJson = {};
    res = {
      status(code: number) {
        responseStatus.code = code;
        return this;
      },
      json(data: unknown) {
        responseJson = data as Record<string, unknown>;
        return this;
      },
    } as unknown as Response;
  });

  it("400 when dateFrom after dateTo", async () => {
    const req = {
      query: {
        konk: "k",
        dateFrom: "2026-06-10",
        dateTo: "2026-06-01",
      },
    } as unknown as Request;
    await getKonkProdManufacturersPieDataController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("404 when util returns ok false", async () => {
    vi.mocked(getKonkProdManufacturersPieDataUtil).mockResolvedValue({
      ok: false,
    });
    const req = {
      query: {
        konk: "k",
        dateFrom: "2026-06-01",
        dateTo: "2026-06-02",
      },
    } as unknown as Request;
    await getKonkProdManufacturersPieDataController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 returns pie data and all summary", async () => {
    vi.mocked(getKonkProdManufacturersPieDataUtil).mockResolvedValue({
      ok: true,
      data: {
        Acme: { title: "Acme", salesPcs: 3, salesUah: 30 },
      },
      all: { title: "Всі виробники", salesPcs: 3, salesUah: 30 },
    });
    const req = {
      query: {
        konk: "k",
        dateFrom: "2026-06-01",
        dateTo: "2026-06-02",
      },
    } as unknown as Request;
    await getKonkProdManufacturersPieDataController(req, res);
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toBeDefined();
    expect(responseJson.all).toBeDefined();
  });
});
