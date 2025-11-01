import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Row } from "../../models/Row.js";
import { createRow } from "../create-row/createRow.js";

describe("createRowController", () => {
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

  it("201: создаёт ряд", async () => {
    const req = { body: { title: "Test Row Controller" } } as unknown as Request;

    await createRow(req, res);

    expect(responseStatus.code).toBe(201);
    expect(responseJson).toBeTruthy();
    expect(responseJson.title).toBe("Test Row Controller");
    expect(responseJson._id).toBeDefined();

    // Cleanup
    await Row.deleteOne({ _id: responseJson._id });
  });

  it("400: ошибка валидации при отсутствии title", async () => {
    const req = { body: {} } as unknown as Request;

    await createRow(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
    expect(Array.isArray(responseJson.errors)).toBe(true);
  });

  it("400: ошибка валидации при пустом title", async () => {
    const req = { body: { title: "" } } as unknown as Request;

    await createRow(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });

  it("500: внутренняя ошибка при дубликате", async () => {
    const existingRow = await Row.create({ title: "Duplicate Title" });

    const req = { body: { title: "Duplicate Title" } } as unknown as Request;
    await createRow(req, res);

    // После нарушения уникальности должна быть 500
    expect(responseStatus.code).toBe(500);

    // Cleanup
    await Row.deleteOne({ _id: existingRow._id });
  });
});

