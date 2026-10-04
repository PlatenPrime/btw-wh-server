import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getProdKonksPieDataController } from "../getProdKonksPieDataController.js";
import { getProdKonksPieDataUtil } from "../utils/getProdKonksPieDataUtil.js";

vi.mock("../utils/getProdKonksPieDataUtil.js");

describe("getProdKonksPieDataController", () => {
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
        prod: "Acme",
        dateFrom: "2026-06-10",
        dateTo: "2026-06-01",
      },
    } as unknown as Request;
    await getProdKonksPieDataController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("404 when util returns ok false", async () => {
    vi.mocked(getProdKonksPieDataUtil).mockResolvedValue({
      ok: false,
    });
    const req = {
      query: {
        prod: "Acme",
        dateFrom: "2026-06-01",
        dateTo: "2026-06-02",
      },
    } as unknown as Request;
    await getProdKonksPieDataController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 returns pie data and all summary", async () => {
    vi.mocked(getProdKonksPieDataUtil).mockResolvedValue({
      ok: true,
      data: {
        air: { title: "Air", salesPcs: 3, salesUah: 30 },
        btrade: { title: "Btrade", salesPcs: 5, salesUah: 50 },
      },
      all: { title: "Всі конкуренти", salesPcs: 8, salesUah: 80 },
    });
    const req = {
      query: {
        prod: "Acme",
        dateFrom: "2026-06-01",
        dateTo: "2026-06-02",
      },
    } as unknown as Request;
    await getProdKonksPieDataController(req, res);
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toBeDefined();
    expect(responseJson.all).toBeDefined();
  });
});
