import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";

import { getAsksByDate } from "../get-asks-by-date/getAsksByDate.js";
import { createTestAsk } from "../../../../test/setup.js";

describe("getAsksByDate", () => {
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

  it("200: возвращает заявки выбранной даты и статистику", async () => {
    await createTestAsk({ createdAt: new Date("2025-02-02T03:00:00.000Z"), status: "new" });
    await createTestAsk({ createdAt: new Date("2025-02-02T10:00:00.000Z"), status: "completed" });
    await createTestAsk({ createdAt: new Date("2025-02-03T00:00:00.000Z"), status: "rejected" });

    const req = { query: { date: "2025-02-02" } } as unknown as Request;

    await getAsksByDate(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.count).toBe(2);
    expect(responseJson.newCount).toBe(1);
    expect(responseJson.completedCount).toBe(1);
    expect(responseJson.rejectedCount).toBe(0);
    expect(responseJson.data).toBeInstanceOf(Array);
  });

  it("400: ошибка валидации при неверной дате", async () => {
    const req = { query: { date: "not-a-date" } } as unknown as Request;
    await getAsksByDate(req, res);
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });
});


