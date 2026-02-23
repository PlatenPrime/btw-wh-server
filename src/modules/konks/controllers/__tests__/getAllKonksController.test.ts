import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../models/Konk.js";
import { getAllKonksController } from "../get-all-konks/getAllKonksController.js";

describe("getAllKonksController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Konk.deleteMany({});
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

  it("200 returns empty array when no konks", async () => {
    const req = {} as unknown as Request;
    await getAllKonksController(req, res);
    expect(responseStatus.code).toBe(200);
    expect(Array.isArray(responseJson.data)).toBe(true);
    expect((responseJson.data as unknown[]).length).toBe(0);
  });

  it("200 returns list of konks", async () => {
    await Konk.create({
      name: "a",
      title: "A",
      url: "https://a.com",
      imageUrl: "https://a.com/1.png",
    });
    const req = {} as unknown as Request;
    await getAllKonksController(req, res);
    expect(responseStatus.code).toBe(200);
    expect((responseJson.data as unknown[]).length).toBe(1);
    expect((responseJson.data as { name: string }[])[0].name).toBe("a");
  });
});
