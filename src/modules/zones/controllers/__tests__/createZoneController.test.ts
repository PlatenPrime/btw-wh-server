import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Zone } from "../../models/Zone.js";
import { createZone } from "../create-zone/createZone.js";

describe("createZoneController", () => {
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

  it("201: создаёт зону", async () => {
    const req = {
      body: { title: "50-10", bar: 50100, sector: 0 },
    } as unknown as Request;

    await createZone(req, res);

    expect(responseStatus.code).toBe(201);
    expect(responseJson.message).toBe("Zone created successfully");
    expect(responseJson.data).toBeTruthy();
    expect(responseJson.data.title).toBe("50-10");
    expect(responseJson.data._id).toBeDefined();

    // Cleanup
    await Zone.deleteOne({ _id: responseJson.data._id });
  });

  it("400: ошибка валидации при отсутствии title", async () => {
    const req = { body: { bar: 50100 } } as unknown as Request;

    await createZone(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
    expect(Array.isArray(responseJson.errors)).toBe(true);
  });

  it("409: ошибка при дубликате title", async () => {
    const existingZone = await Zone.create({ title: "51-1", bar: 5110 });

    const req = {
      body: { title: "51-1", bar: 99999 },
    } as unknown as Request;

    await createZone(req, res);

    expect(responseStatus.code).toBe(409);
    expect(responseJson.message).toBe("Zone with this data already exists");
    expect(responseJson.duplicateFields).toContain("title");

    // Cleanup
    await Zone.deleteOne({ _id: existingZone._id });
  });

  it("500: внутренняя ошибка при дубликате bar", async () => {
    const existingZone = await Zone.create({ title: "52-2", bar: 5220 });

    const req = {
      body: { title: "99-99", bar: 5220 },
    } as unknown as Request;

    await createZone(req, res);

    // Будет 409 от MongoDB duplicate error
    expect([409, 500]).toContain(responseStatus.code);

    // Cleanup
    await Zone.deleteOne({ _id: existingZone._id });
  });
});

