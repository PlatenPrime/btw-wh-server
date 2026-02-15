import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Del } from "../../models/Del.js";
import { createDelController } from "../create-del/createDelController.js";

describe("createDelController", () => {
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

  it("400 when title missing", async () => {
    const req = { body: {} } as Request;
    await createDelController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("201 creates del and returns data", async () => {
    const req = {
      body: { title: "New", artikuls: { "ART-1": 10 } },
    } as Request;
    await createDelController(req, res);
    expect(responseStatus.code).toBe(201);
    expect((responseJson.data as any).title).toBe("New");
    const count = await Del.countDocuments();
    expect(count).toBe(1);
  });
});
