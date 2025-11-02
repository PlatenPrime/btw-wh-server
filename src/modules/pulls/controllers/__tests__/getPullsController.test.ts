import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { getPullsController } from "../get-pulls/getPullsController.js";

describe("getPullsController", () => {
  let res: Response;
  let responseJson: any;
  let responseStatus: any;

  beforeEach(() => {
    responseJson = {};
    responseStatus = {};
    res = {
      status: function (code: number) {
        responseStatus.code = code;
        return this;
      },
      json: function (data: any) {
        responseJson = data;
        return this;
      },
      headersSent: false,
    } as unknown as Response;
  });

  it("200: возвращает pulls с корректной структурой", async () => {
    const req = {} as Request;

    await getPullsController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.success).toBe(true);
    expect(responseJson.message).toBe("Pulls calculated successfully");
    expect(responseJson.data).toBeDefined();
    expect(responseJson.data).toHaveProperty("pulls");
    expect(responseJson.data).toHaveProperty("totalPulls");
    expect(responseJson.data).toHaveProperty("totalAsks");
    expect(Array.isArray(responseJson.data.pulls)).toBe(true);
  });
});
