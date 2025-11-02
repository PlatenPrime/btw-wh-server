import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Ask } from "../../../asks/models/Ask.js";
import { Pos } from "../../../poses/models/Pos.js";
import { Row } from "../../../rows/models/Row.js";
import { Pallet } from "../../../pallets/models/Pallet.js";
import { processPullPositionController } from "../process-pull-position/processPullPositionController.js";

describe("processPullPositionController", () => {
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

  it("400: ошибка валидации при невалидных ObjectId", async () => {
    const req = {
      params: {
        palletId: "invalid",
        posId: "invalid",
      },
      body: {
        askId: new mongoose.Types.ObjectId().toString(),
        actualQuant: 5,
        solverId: new mongoose.Types.ObjectId().toString(),
      },
    } as unknown as Request;

    await processPullPositionController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.success).toBe(false);
  });

  it("400: ошибка валидации тела запроса", async () => {
    const req = {
      params: {
        palletId: new mongoose.Types.ObjectId().toString(),
        posId: new mongoose.Types.ObjectId().toString(),
      },
      body: {
        // Отсутствует askId
        actualQuant: 5,
        solverId: new mongoose.Types.ObjectId().toString(),
      },
    } as unknown as Request;

    await processPullPositionController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.success).toBe(false);
    expect(responseJson.message).toBe("Invalid request data");
  });

  it("200: обрабатывает позицию успешно", async () => {
    // Создаем тестовые данные с уникальными username
    const asker = await createTestUser({
      fullname: "Asker",
      username: `asker-${Date.now()}-${Math.random()}`,
    });
    const solver = await createTestUser({
      fullname: "Solver",
      username: `solver-${Date.now()}-${Math.random()}`,
    });

    const row = await Row.create({
      title: "Test Row",
      pallets: [],
    });

    const pallet = await Pallet.create({
      title: "Test Pallet",
      row: row._id,
      rowData: {
        _id: row._id,
        title: row.title,
      },
      sector: "1",
      isDef: false,
    });

    const position = await Pos.create({
      pallet: pallet._id,
      row: row._id,
      palletData: {
        _id: pallet._id,
        title: pallet.title,
        sector: pallet.sector,
        isDef: pallet.isDef,
      },
      rowData: {
        _id: row._id,
        title: row.title,
      },
      palletTitle: pallet.title,
      rowTitle: row.title,
      artikul: "ART-001",
      nameukr: "Test Article",
      quant: 10,
      boxes: 1,
      sklad: "pogrebi",
      comment: "",
    });

    const ask = await Ask.create({
      artikul: "ART-001",
      nameukr: "Test Article",
      quant: 5,
      asker: asker._id,
      askerData: {
        _id: asker._id,
        fullname: asker.fullname,
        telegram: asker.telegram,
        photo: asker.photo,
      },
      solver: solver._id,
      status: "new",
      actions: [],
    });

    const req = {
      params: {
        palletId: pallet._id.toString(),
        posId: position._id.toString(),
      },
      body: {
        askId: String(ask._id),
        actualQuant: 3,
        solverId: solver._id.toString(),
      },
    } as unknown as Request;

    await processPullPositionController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.success).toBe(true);
    expect(responseJson.data).toBeDefined();
    expect(responseJson.data.actualQuant).toBe(3);
    expect(responseJson.data.askProgress).toBeDefined();
    expect(responseJson.data.askFullyProcessed).toBeDefined();

    // Проверяем что количество обновилось
    const updatedPosition = await Pos.findById(position._id);
    expect(updatedPosition?.quant).toBe(7); // 10 - 3

    // Проверяем что action добавился
    const updatedAsk = await Ask.findById(ask._id);
    expect(updatedAsk?.actions.length).toBeGreaterThan(0);
  });

  it("422: ошибка если пытаются взять больше чем есть", async () => {
    const asker = await createTestUser({
      fullname: "Asker",
      username: `asker-${Date.now()}-${Math.random()}`,
    });
    const solver = await createTestUser({
      fullname: "Solver",
      username: `solver-${Date.now()}-${Math.random()}`,
    });

    const row = await Row.create({
      title: "Test Row",
      pallets: [],
    });

    const pallet = await Pallet.create({
      title: "Test Pallet",
      row: row._id,
      rowData: {
        _id: row._id,
        title: row.title,
      },
      sector: "1",
      isDef: false,
    });

    const position = await Pos.create({
      pallet: pallet._id,
      row: row._id,
      palletData: {
        _id: pallet._id,
        title: pallet.title,
        sector: pallet.sector,
        isDef: pallet.isDef,
      },
      rowData: {
        _id: row._id,
        title: row.title,
      },
      palletTitle: pallet.title,
      rowTitle: row.title,
      artikul: "ART-001",
      nameukr: "Test Article",
      quant: 5, // Только 5 штук
      boxes: 1,
      sklad: "pogrebi",
      comment: "",
    });

    const ask = await Ask.create({
      artikul: "ART-001",
      nameukr: "Test Article",
      quant: 10,
      asker: asker._id,
      askerData: {
        _id: asker._id,
        fullname: asker.fullname,
        telegram: asker.telegram,
        photo: asker.photo,
      },
      solver: solver._id,
      status: "new",
      actions: [],
    });

    const req = {
      params: {
        palletId: pallet._id.toString(),
        posId: position._id.toString(),
      },
      body: {
        askId: String(ask._id),
        actualQuant: 10, // Пытаемся взять больше чем есть
        solverId: solver._id.toString(),
      },
    } as unknown as Request;

    await processPullPositionController(req, res);

    expect(responseStatus.code).toBe(422);
    expect(responseJson.success).toBe(false);
    expect(responseJson.message).toContain("Неможливо зняти");
  });
});
