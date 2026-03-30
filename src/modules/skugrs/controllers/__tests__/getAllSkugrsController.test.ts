import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Skugr } from "../../models/Skugr.js";
import { getAllSkugrsController } from "../get-all-skugrs/getAllSkugrsController.js";

describe("getAllSkugrsController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Skugr.deleteMany({});
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

  it("400 for invalid query", async () => {
    const req = { query: { page: "0" } } as unknown as Request;
    await getAllSkugrsController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("200 with filters", async () => {
    await Skugr.create({
      konkName: "k1",
      prodName: "p1",
      title: "One",
      url: "https://k.com/1",
      skus: [],
    });
    await Skugr.create({
      konkName: "k2",
      prodName: "p1",
      title: "Two",
      url: "https://k.com/2",
      skus: [],
    });

    const req = {
      query: { page: "1", limit: "10", konkName: "k1", prodName: "p1" },
    } as unknown as Request;

    await getAllSkugrsController(req, res);

    expect(responseStatus.code).toBe(200);
    const data = responseJson.data as unknown[];
    expect(data).toHaveLength(1);
    expect((responseJson.pagination as { total: number }).total).toBe(1);
  });

  it("200 with isSliced filter", async () => {
    await Skugr.create({
      konkName: "k1",
      prodName: "p1",
      title: "Sliced",
      url: "https://k.com/11",
      skus: [],
      isSliced: true,
    });
    await Skugr.create({
      konkName: "k1",
      prodName: "p1",
      title: "Not sliced",
      url: "https://k.com/12",
      skus: [],
      isSliced: false,
    });

    const req = {
      query: { page: "1", limit: "10", isSliced: "false" },
    } as unknown as Request;

    await getAllSkugrsController(req, res);

    expect(responseStatus.code).toBe(200);
    const data = responseJson.data as Array<{ isSliced: boolean; title: string }>;
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe("Not sliced");
    expect(data[0].isSliced).toBe(false);
  });
});
