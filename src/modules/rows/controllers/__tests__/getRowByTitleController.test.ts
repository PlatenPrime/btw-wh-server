import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Row } from "../../models/Row.js";
import { getRowByTitle } from "../get-row-by-title/getRowByTitle.js";

describe("getRowByTitleController", () => {
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
    const row = await Row.create({ title: "Test Search Row" });
    const req = { params: { title: "Test Search Row" } } as unknown as Request;

    await getRowByTitle(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(true);
    expect(responseJson.message).toBe("Row retrieved successfully");
    expect(responseJson.data).toBeTruthy();
    expect(responseJson.data.title).toBe("Test Search Row");
  });

  it("200: возвращает exists: false когда ряд не найден", async () => {
    const req = { params: { title: "NonExistent" } } as unknown as Request;

    await getRowByTitle(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(false);
    expect(responseJson.message).toBe("Row not found");
    expect(responseJson.data).toBeNull();
  });

  it("400: ошибка валидации при пустом title", async () => {
    const req = { params: { title: "" } } as unknown as Request;

    await getRowByTitle(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
    expect(Array.isArray(responseJson.errors)).toBe(true);
  });
});

