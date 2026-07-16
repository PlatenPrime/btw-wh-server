import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Sku } from "../../models/Sku.js";
import { fixIncorrectSkuDataController } from "../fix-incorrect-sku-data/fixIncorrectSkuDataController.js";

describe("fixIncorrectSkuDataController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Sku.deleteMany({});
    await Event.deleteMany({});
    responseJson = {};
    responseStatus = {};
    res = {
      status(code: number) {
        responseStatus.code = code;
        return this;
      },
      json(data: unknown) {
        responseJson = data as Record<string, unknown>;
        return this;
      },
      headersSent: false,
    } as unknown as Response;
  });

  it("400 when validation fails", async () => {
    const req = {
      body: { filter: {}, updates: {} },
    } as unknown as Request;
    await fixIncorrectSkuDataController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("200 fixes sku data", async () => {
    await Sku.create({
      konkName: "k-fix",
      prodName: "p1",
      productId: "k-fix-1",
      title: "Before",
      url: "https://k-fix.com/1",
    });

    const req = {
      body: {
        filter: { konkName: "k-fix" },
        updates: { title: "After" },
      },
    } as unknown as Request;

    await fixIncorrectSkuDataController(req, res);

    expect(responseStatus.code).toBe(200);
    const data = responseJson.data as { modifiedCount: number };
    expect(data.modifiedCount).toBe(1);
  });

  it("200 creates audit event when req.user is present", async () => {
    const user = await createTestUser({ username: `sku-fix-event-${Date.now()}` });
    await Sku.create({
      konkName: "k-fix-event",
      prodName: "p1",
      productId: "k-fix-event-1",
      title: "Before",
      url: "https://k-fix-event.com/1",
    });

    const req = {
      body: {
        filter: { konkName: "k-fix-event" },
        updates: { title: "After" },
      },
      user: { id: user._id.toString(), role: "ADMIN" },
    } as unknown as Request;

    await fixIncorrectSkuDataController(req, res);

    expect(responseStatus.code).toBe(200);
    const events = await Event.find({ department: "skus" });
    expect(events).toHaveLength(1);
    expect(events[0].userId.toString()).toBe(user._id.toString());
  });
});
