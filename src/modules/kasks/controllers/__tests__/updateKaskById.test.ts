import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Kask } from "../../models/Kask.js";
import { updateKaskById } from "../update-kask-by-id/updateKaskById.js";

describe("updateKaskById", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Kask.deleteMany({});
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

  it("400 when id invalid", async () => {
    const req = {
      params: { id: "invalid" },
      body: { zone: "B2" },
    } as unknown as Request;
    await updateKaskById(req, res);
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });

  it("400 when body empty", async () => {
    const kask = await Kask.create({
      artikul: "1234-5678",
      nameukr: "Товар",
      zone: "A1",
    });
    const req = {
      params: { id: String(kask._id) },
      body: {},
    } as unknown as Request;
    await updateKaskById(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("404 when kask not found", async () => {
    const req = {
      params: { id: "000000000000000000000000" },
      body: { zone: "B2" },
    } as unknown as Request;
    await updateKaskById(req, res);
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Kask not found");
  });

  it("200 updates and returns data", async () => {
    const kask = await Kask.create({
      artikul: "1234-5678",
      nameukr: "Старе",
      zone: "A1",
      quant: 1,
    });
    const req = {
      params: { id: String(kask._id) },
      body: { nameukr: "Нове", quant: 5 },
    } as unknown as Request;

    await updateKaskById(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Kask updated successfully");
    expect((responseJson.data as { nameukr: string }).nameukr).toBe("Нове");
    expect((responseJson.data as { quant: number }).quant).toBe(5);
  });
});
