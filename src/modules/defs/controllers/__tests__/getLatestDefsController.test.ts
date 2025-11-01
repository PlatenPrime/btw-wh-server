import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { Def } from "../../models/Def.js";
import { createTestAsk } from "../../../../test/setup.js";
import { getLatestDefsController } from "../get-latest-defs/getLatestDefsController.js";

describe("getLatestDefsController", () => {
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

  it("200: возвращает exists=true и данные при наличии дефицитов", async () => {
    // Создаем запись дефицитов
    const def = await Def.create({
      result: {
        ART001: {
          nameukr: "Товар 1",
          quant: 10,
          sharikQuant: 5,
          difQuant: -5,
          defLimit: 30,
          status: "critical",
        },
      },
      total: 1,
      totalCriticalDefs: 1,
      totalLimitDefs: 0,
    });

    const req = {} as unknown as Request;
    await getLatestDefsController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(true);
    expect(responseJson.message).toBe("Latest deficit calculation retrieved successfully");
    expect(responseJson.data).toBeDefined();
    expect(responseJson.data._id).toBeDefined();
    expect(responseJson.data.total).toBe(1);
  });

  it("200: возвращает exists=false при отсутствии дефицитов", async () => {
    const req = {} as unknown as Request;
    await getLatestDefsController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(false);
    expect(responseJson.message).toBe("No deficit calculations found");
    expect(responseJson.data).toBeNull();
  });

  it("200: обогащает дефициты информацией о заявках", async () => {
    // Создаем запись дефицитов
    const def = await Def.create({
      result: {
        ART001: {
          nameukr: "Товар 1",
          quant: 10,
          sharikQuant: 5,
          difQuant: -5,
          defLimit: 30,
          status: "critical",
        },
      },
      total: 1,
      totalCriticalDefs: 1,
      totalLimitDefs: 0,
    });

    // Создаем заявку для этого артикула
    const ask = await createTestAsk({
      artikul: "ART001",
      status: "new",
    });

    const req = {} as unknown as Request;
    await getLatestDefsController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(true);
    expect(responseJson.data.result.ART001).toBeDefined();
    expect(responseJson.data.result.ART001).toHaveProperty("existingAsk");
    expect(responseJson.data.result.ART001.existingAsk).not.toBeNull();
    expect(responseJson.data.result.ART001.existingAsk._id).toBe(String(ask._id));
  });

  it("200: возвращает null для existingAsk если заявки нет", async () => {
    // Создаем запись дефицитов
    const def = await Def.create({
      result: {
        ART001: {
          nameukr: "Товар 1",
          quant: 10,
          sharikQuant: 5,
          difQuant: -5,
          defLimit: 30,
          status: "critical",
        },
      },
      total: 1,
      totalCriticalDefs: 1,
      totalLimitDefs: 0,
    });

    const req = {} as unknown as Request;
    await getLatestDefsController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(true);
    expect(responseJson.data.result.ART001.existingAsk).toBeNull();
  });

  it("200: возвращает только первую заявку для артикула", async () => {
    // Создаем запись дефицитов
    const def = await Def.create({
      result: {
        ART001: {
          nameukr: "Товар 1",
          quant: 10,
          sharikQuant: 5,
          difQuant: -5,
          defLimit: 30,
          status: "critical",
        },
      },
      total: 1,
      totalCriticalDefs: 1,
      totalLimitDefs: 0,
    });

    // Создаем первую заявку
    const firstAsk = await createTestAsk({
      artikul: "ART001",
      status: "new",
    });

    // Создаем вторую заявку
    const secondAsk = await createTestAsk({
      artikul: "ART001",
      status: "new",
    });

    const req = {} as unknown as Request;
    await getLatestDefsController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(true);
    expect(responseJson.data.result.ART001.existingAsk._id).toBe(String(firstAsk._id));
    expect(responseJson.data.result.ART001.existingAsk._id).not.toBe(String(secondAsk._id));
  });

  it("возвращает последнюю запись если их несколько", async () => {
    // Создаем первую запись
    await Def.create({
      result: {
        ART001: {
          nameukr: "Товар 1",
          quant: 10,
          sharikQuant: 5,
          difQuant: -5,
          defLimit: 30,
          status: "critical",
        },
      },
      total: 1,
      totalCriticalDefs: 1,
      totalLimitDefs: 0,
    });

    // Создаем вторую запись (должна быть возвращена)
    const def2 = await Def.create({
      result: {
        ART002: {
          nameukr: "Товар 2",
          quant: 20,
          sharikQuant: 25,
          difQuant: 5,
          defLimit: 40,
          status: "limited",
        },
      },
      total: 1,
      totalCriticalDefs: 0,
      totalLimitDefs: 1,
    });

    const req = {} as unknown as Request;
    await getLatestDefsController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(true);
    expect(responseJson.data.result).toHaveProperty("ART002");
    expect(responseJson.data.result).not.toHaveProperty("ART001");
  });
});

