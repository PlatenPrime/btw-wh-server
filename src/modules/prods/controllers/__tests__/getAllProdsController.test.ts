import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Prod } from "../../models/Prod.js";
import { getAllProdsController } from "../get-all-prods/getAllProdsController.js";

describe("getAllProdsController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Prod.deleteMany({});
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

  it("200 returns empty array when no prods", async () => {
    const req = {} as unknown as Request;
    await getAllProdsController(req, res);
    expect(responseStatus.code).toBe(200);
    expect(Array.isArray(responseJson.data)).toBe(true);
    expect((responseJson.data as unknown[]).length).toBe(0);
  });

  it("200 returns list of prods", async () => {
    await Prod.create({
      name: "a",
      title: "A",
      imageUrl: "https://a.com/1.png",
    });
    const req = {} as unknown as Request;
    await getAllProdsController(req, res);
    expect(responseStatus.code).toBe(200);
    expect((responseJson.data as unknown[]).length).toBe(1);
    expect((responseJson.data as { name: string }[])[0].name).toBe("a");
  });
});
