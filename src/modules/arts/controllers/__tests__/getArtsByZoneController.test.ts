import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestArt } from "../../../../test/setup.js";
import { getArtsByZoneController } from "../get-arts-by-zone/getArtsByZoneController.js";

describe("getArtsByZoneController", () => {
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
    } as unknown as Response;
  });

  it("200: возвращает артикулы по зоне", async () => {
    await createTestArt({ artikul: "ART-A1-1", zone: "A1" });
    await createTestArt({ artikul: "ART-A1-2", zone: "A1" });

    const req = { params: { zone: "A1" } } as unknown as Request;

    await getArtsByZoneController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(Array.isArray(responseJson.data)).toBe(true);
    expect(responseJson.data).toHaveLength(2);
    expect(responseJson.total).toBe(2);
  });

  it("200: возвращает пустой массив если артикулов в зоне нет", async () => {
    const req = { params: { zone: "EMPTY" } } as unknown as Request;

    await getArtsByZoneController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toEqual([]);
    expect(responseJson.total).toBe(0);
  });

  it("400: ошибка валидации при пустом zone", async () => {
    const req = { params: { zone: "" } } as unknown as Request;

    await getArtsByZoneController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Invalid zone parameter");
  });
});

