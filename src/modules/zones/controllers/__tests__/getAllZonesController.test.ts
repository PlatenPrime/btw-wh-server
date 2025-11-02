import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Zone } from "../../models/Zone.js";
import { getAllZones } from "../get-all-zones/getAllZones.js";

describe("getAllZonesController", () => {
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

  it("200: возвращает все зоны с пагинацией", async () => {
    await Zone.create({ title: "50-1", bar: 5010, sector: 0 });
    await Zone.create({ title: "50-2", bar: 5020, sector: 0 });

    const req = { query: { page: "1", limit: "10" } } as unknown as Request;

    await getAllZones(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Zones retrieved successfully");
    expect(Array.isArray(responseJson.data)).toBe(true);
    expect(responseJson.pagination).toBeTruthy();
  });

  it("200: возвращает зоны с поиском", async () => {
    await Zone.create({ title: "search-1", bar: 5555, sector: 0 });

    const req = { query: { search: "search" } } as unknown as Request;

    await getAllZones(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(1);
  });

  it("400: ошибка валидации при невалидных параметрах", async () => {
    const req = { query: { page: "-1" } } as unknown as Request;

    await getAllZones(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Invalid query parameters");
  });
});







