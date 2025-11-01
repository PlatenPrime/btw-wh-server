import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestArt } from "../../../../test/setup.js";
import { upsertArtsController } from "../upsert-arts/upsertArtsController.js";

describe("upsertArtsController", () => {
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

  it("200: создаёт новые артикулы", async () => {
    const req = {
      body: [
        { artikul: "NEW-001", zone: "A1", nameukr: "New Art 1" },
        { artikul: "NEW-002", zone: "A2", nameukr: "New Art 2" },
      ],
    } as unknown as Request;

    await upsertArtsController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Upsert completed");
    expect(responseJson.result.upsertedCount).toBe(2);
  });

  it("200: обновляет существующие артикулы", async () => {
    await createTestArt({ artikul: "EXIST-001", zone: "A1" });

    const req = {
      body: [{ artikul: "EXIST-001", zone: "A2", nameukr: "Updated" }],
    } as unknown as Request;

    await upsertArtsController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.result.modifiedCount).toBe(1);
  });

  it("400: ошибка валидации при пустом массиве", async () => {
    const req = { body: [] } as unknown as Request;

    await upsertArtsController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });

  it("400: ошибка валидации при отсутствии artikul", async () => {
    const req = {
      body: [{ zone: "A1", nameukr: "Test" }],
    } as unknown as Request;

    await upsertArtsController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });
});

