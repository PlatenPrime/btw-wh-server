import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { createAskController } from "../create-ask/createAskController.js";

describe("createAskController", () => {
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
    vi.clearAllMocks();
  });

  it("201: создаёт заявку", async () => {
    const user = await createTestUser({ fullname: "Asker" });

    const req = {
      body: {
        artikul: "ART-NEW",
        nameukr: "Найменування",
        quant: 4,
        com: "комент",
        askerId: String(user._id),
      },
    } as unknown as Request;

    await createAskController(req, res);

    expect(responseStatus.code).toBe(201);
    expect(responseJson).toBeTruthy();
    expect(responseJson.artikul).toBe("ART-NEW");
    expect(responseJson.status).toBe("new");
    expect(responseJson._id).toBeDefined();
  });

  it("201: создаёт заявку с полем zone", async () => {
    const user = await createTestUser({ fullname: "Asker" });

    const req = {
      body: {
        artikul: "ART-ZONE",
        nameukr: "Товар з зоною",
        quant: 2,
        com: "коментар",
        zone: "Зона А",
        askerId: String(user._id),
      },
    } as unknown as Request;

    await createAskController(req, res);

    expect(responseStatus.code).toBe(201);
    expect(responseJson).toBeTruthy();
    expect(responseJson.artikul).toBe("ART-ZONE");
    expect(responseJson.zone).toBe("Зона А");
    expect(responseJson.status).toBe("new");
    expect(responseJson._id).toBeDefined();
  });

  it("201: создаёт audit-событие, когда есть req.user", async () => {
    const user = await createTestUser({ fullname: "Asker" });

    const req = {
      user: { id: String(user._id), role: "user" },
      body: {
        artikul: "ART-EVENT",
        nameukr: "Найменування",
        quant: 3,
        com: "комент",
        askerId: String(user._id),
      },
    } as unknown as Request;

    await createAskController(req, res);

    expect(responseStatus.code).toBe(201);
    const events = await Event.find({ department: "asks" });
    expect(events).toHaveLength(1);
    expect(events[0].userId.toString()).toBe(String(user._id));
    expect(events[0].description).toBe(
      "Створено заявку на артикул ART-EVENT (3 шт.)"
    );
  });

  it("201: не создаёт audit-событие без req.user", async () => {
    const user = await createTestUser({ fullname: "Asker" });

    const req = {
      body: {
        artikul: "ART-NO-USER",
        nameukr: "Найменування",
        quant: 1,
        com: "",
        askerId: String(user._id),
      },
    } as unknown as Request;

    await createAskController(req, res);

    expect(responseStatus.code).toBe(201);
    const events = await Event.find({ department: "asks" });
    expect(events).toHaveLength(0);
  });

  it("400: ошибка валидации при отсутствии artikul", async () => {
    const user = await createTestUser();
    const req = {
      body: {
        // artikul пропущен
        nameukr: "Найменування",
        quant: 4,
        com: "комент",
        askerId: String(user._id),
      },
    } as unknown as Request;

    await createAskController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
    expect(Array.isArray(responseJson.errors)).toBe(true);
  });

  it("404: если пользователь не найден", async () => {
    const req = {
      body: {
        artikul: "ART-NEW",
        nameukr: "Найменування",
        quant: 1,
        com: "",
        askerId: new mongoose.Types.ObjectId().toString(),
      },
    } as unknown as Request;

    await createAskController(req, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("User not found");
  });
});
