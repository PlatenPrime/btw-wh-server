import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Kask } from "../../models/Kask.js";
import { deleteKaskById } from "../delete-kask-by-id/deleteKaskById.js";

describe("deleteKaskById", () => {
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
    const req = { params: { id: "invalid" } } as unknown as Request;
    await deleteKaskById(req, res);
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });

  it("404 when kask not found", async () => {
    const req = {
      params: { id: "000000000000000000000000" },
    } as unknown as Request;
    await deleteKaskById(req, res);
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Kask not found");
  });

  it("200 deletes kask and returns artikul", async () => {
    const kask = await Kask.create({
      artikul: "5555-5555",
      nameukr: "To delete",
      zone: "A1",
    });
    const req = { params: { id: String(kask._id) } } as unknown as Request;

    await deleteKaskById(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Kask deleted successfully");
    expect((responseJson.data as { artikul: string }).artikul).toBe("5555-5555");
    const found = await Kask.findById(kask._id);
    expect(found).toBeNull();
  });
});
