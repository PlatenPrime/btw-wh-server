import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnsupportedKonkForGroupProductsError } from "../../../../browser/group-products/fetchGroupProductsByKonkName.js";
import { fillSkugrSkusController } from "../fillSkugrSkusController.js";

vi.mock("../../../utils/fillSkugrSkusFromBrowserUtil.js", () => ({
  fillSkugrSkusFromBrowserUtil: vi.fn(),
}));

import { fillSkugrSkusFromBrowserUtil } from "../../../utils/fillSkugrSkusFromBrowserUtil.js";

const mockFill = vi.mocked(fillSkugrSkusFromBrowserUtil);

describe("fillSkugrSkusController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(() => {
    mockFill.mockReset();
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

  it("400 on validation error", async () => {
    const req = {
      params: { id: "" },
      body: {},
    } as unknown as Request;

    await fillSkugrSkusController(req, res);

    expect(responseStatus.code).toBe(400);
  });

  it("404 when skugr not found", async () => {
    mockFill.mockResolvedValue(null);

    const req = {
      params: { id: "507f1f77bcf86cd799439011" },
      body: {},
    } as unknown as Request;

    await fillSkugrSkusController(req, res);

    expect(responseStatus.code).toBe(404);
  });

  it("400 on unsupported konk from util", async () => {
    mockFill.mockRejectedValue(new UnsupportedKonkForGroupProductsError("air"));

    const req = {
      params: { id: "507f1f77bcf86cd799439011" },
      body: {},
    } as unknown as Request;

    await fillSkugrSkusController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toMatch(/air/);
  });
});
