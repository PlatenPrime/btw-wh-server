import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestRow } from "../../../../test/utils/testHelpers.js";
import { createPalletController } from "../create-pallet/createPalletController.js";

describe("createPalletController", () => {
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

  it("201: создаёт паллету", async () => {
    const row = await createTestRow({ title: "Row 1" });

    const req = {
      body: {
        title: "Pallet-1-1",
        rowData: {
          _id: String(row._id),
          title: row.title,
        },
        sector: "A",
        isDef: false,
      },
    } as unknown as Request;

    await createPalletController(req, res);

    expect(responseStatus.code).toBe(201);
    expect(responseJson._id).toBeDefined();
    expect(responseJson.title).toBe("Pallet-1-1");
    expect(responseJson.sector).toBe("A");
  });

  it("400: ошибка валидации при отсутствии title", async () => {
    const row = await createTestRow();

    const req = {
      body: {
        rowData: {
          _id: String(row._id),
          title: row.title,
        },
      },
    } as unknown as Request;

    await createPalletController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });

  it("404: если Row не найден", async () => {
    const req = {
      body: {
        title: "Pallet-1-1",
        rowData: {
          _id: new mongoose.Types.ObjectId().toString(),
          title: "NonExistent Row",
        },
      },
    } as unknown as Request;

    await createPalletController(req, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Row not found");
  });
});

