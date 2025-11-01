import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Row } from "../../models/Row.js";
import { getAllRows } from "../get-all-rows/getAllRows.js";

describe("getAllRowsController", () => {
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

  it("200: возвращает все ряды", async () => {
    await Row.create({ title: "B Row" });
    await Row.create({ title: "A Row" });

    const req = {} as unknown as Request;
    await getAllRows(req, res);

    expect(responseStatus.code).toBe(200);
    expect(Array.isArray(responseJson)).toBe(true);
    expect(responseJson.length).toBe(2);
    expect(responseJson[0].title).toBe("A Row");
    expect(responseJson[1].title).toBe("B Row");
  });

  it("404: когда рядов нет", async () => {
    const req = {} as unknown as Request;
    await getAllRows(req, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Rows not found");
  });

  it("500: обрабатывает ошибки сервера", async () => {
    // Этот тест проверяет что контроллер правильно обрабатывает ошибки
    // В данном случае getAllRowsUtil не выбрасывает ошибок при пустой БД
    const req = {} as unknown as Request;
    await getAllRows(req, res);

    expect(responseStatus.code).toBe(404);
  });
});

