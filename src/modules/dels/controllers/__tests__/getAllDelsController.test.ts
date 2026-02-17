import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Del } from "../../models/Del.js";
import { getAllDelsController } from "../get-all-dels/getAllDelsController.js";

describe("getAllDelsController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Del.deleteMany({});
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

  it("200: returns list without artikuls", async () => {
    await Del.create({
      title: "Delivery 1",
      artikuls: { "ART-1": { quantity: 5 } },
    });
    const req = {} as Request;
    await getAllDelsController(req, res);
    expect(responseStatus.code).toBe(200);
    expect((responseJson.data as any[]).length).toBe(1);
    expect((responseJson.data as any[])[0].title).toBe("Delivery 1");
    expect((responseJson.data as any[])[0]).not.toHaveProperty("artikuls");
  });
});
