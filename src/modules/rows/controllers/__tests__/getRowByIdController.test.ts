import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Pallet } from "../../../pallets/models/Pallet.js";
import { Row } from "../../models/Row.js";
import { getRowById } from "../get-row-by-id/getRowById.js";

describe("getRowByIdController", () => {
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

  it("200: возвращает ряд с exists: true", async () => {
    const row = await Row.create({ title: "Test Row" });
    const req = { params: { id: row._id.toString() } } as unknown as Request;

    await getRowById(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(true);
    expect(responseJson.message).toBe("Row retrieved successfully");
    expect(responseJson.data).toBeTruthy();
    expect(responseJson.data._id.toString()).toBe(row._id.toString());
    expect(responseJson.data.title).toBe("Test Row");
  });

  it("200: возвращает exists: false когда ряд не найден", async () => {
    const req = { params: { id: "000000000000000000000000" } } as unknown as Request;

    await getRowById(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(false);
    expect(responseJson.message).toBe("Row not found");
    expect(responseJson.data).toBeNull();
  });

  it("400: ошибка валидации при невалидном ID", async () => {
    const req = { params: { id: "invalid-id" } } as unknown as Request;

    await getRowById(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
    expect(Array.isArray(responseJson.errors)).toBe(true);
  });

  it("200: возвращает ряд с паллетами", async () => {
    const row = await Row.create({ title: "Row With Pallets" });
    const pallet = await Pallet.create({
      title: "Pallet 1",
      row: { _id: row._id, title: row.title },
      rowData: { _id: row._id, title: row.title },
      poses: [],
    });

    const req = { params: { id: row._id.toString() } } as unknown as Request;
    await getRowById(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.data.pallets).toHaveLength(1);
    expect(responseJson.data.pallets[0].title).toBe("Pallet 1");
  });
});

