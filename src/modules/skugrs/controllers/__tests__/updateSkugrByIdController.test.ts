import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Skugr } from "../../models/Skugr.js";
import { updateSkugrByIdController } from "../update-skugr-by-id/updateSkugrByIdController.js";

describe("updateSkugrByIdController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Skugr.deleteMany({});
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

  it("404 when missing", async () => {
    const req = {
      params: { id: "507f1f77bcf86cd799439011" },
      body: { title: "X" },
    } as unknown as Request;

    await updateSkugrByIdController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 updates", async () => {
    const doc = await Skugr.create({
      konkName: "k",
      prodName: "p",
      title: "Old",
      url: "https://k.com/o",
      skus: [],
    });

    const req = {
      params: { id: doc._id.toString() },
      body: { title: "New" },
    } as unknown as Request;

    await updateSkugrByIdController(req, res);

    expect(responseStatus.code).toBe(200);
    expect((responseJson.data as { title: string }).title).toBe("New");
  });

  it("200 updates isSliced", async () => {
    const doc = await Skugr.create({
      konkName: "k",
      prodName: "p",
      title: "Old 2",
      url: "https://k.com/o2",
      skus: [],
      isSliced: true,
    });

    const req = {
      params: { id: doc._id.toString() },
      body: { isSliced: false },
    } as unknown as Request;

    await updateSkugrByIdController(req, res);

    expect(responseStatus.code).toBe(200);
    expect((responseJson.data as { isSliced: boolean }).isSliced).toBe(false);
  });

  it("200 creates audit event when req.user is present", async () => {
    const user = await createTestUser({ username: `skugr-update-event-${Date.now()}` });
    const doc = await Skugr.create({
      konkName: "k",
      prodName: "p",
      title: "Old",
      url: "https://k.com/o-event",
      skus: [],
    });

    const req = {
      params: { id: doc._id.toString() },
      body: { title: "New" },
      user: { id: user._id.toString(), role: "ADMIN" },
    } as unknown as Request;

    await updateSkugrByIdController(req, res);

    expect(responseStatus.code).toBe(200);
    const events = await Event.find({ department: "skugrs" });
    expect(events).toHaveLength(1);
    expect(events[0].userId.toString()).toBe(user._id.toString());
  });
});
