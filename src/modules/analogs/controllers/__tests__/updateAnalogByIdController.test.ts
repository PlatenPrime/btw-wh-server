import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Analog } from "../../models/Analog.js";
import { updateAnalogByIdController } from "../update-analog-by-id/updateAnalogByIdController.js";

describe("updateAnalogByIdController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Analog.deleteMany({});
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

  it("400 when id invalid", async () => {
    const req = {
      params: { id: "invalid" },
      body: { title: "New" },
    } as unknown as Request;
    await updateAnalogByIdController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("400 when body empty", async () => {
    const analog = await Analog.create({
      konkName: "k",
      prodName: "p",
      url: "https://x.com",
    });
    const req = {
      params: { id: analog._id.toString() },
      body: {},
    } as unknown as Request;
    await updateAnalogByIdController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("404 when analog not found", async () => {
    const req = {
      params: { id: "000000000000000000000000" },
      body: { nameukr: "New" },
    } as unknown as Request;
    await updateAnalogByIdController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 updates analog", async () => {
    const analog = await Analog.create({
      konkName: "k",
      prodName: "p",
      url: "https://x.com",
      nameukr: "Old",
    });
    const req = {
      params: { id: analog._id.toString() },
      body: { nameukr: "New name" },
    } as unknown as Request;
    await updateAnalogByIdController(req, res);
    expect(responseStatus.code).toBe(200);
    expect((responseJson.data as { nameukr: string }).nameukr).toBe("New name");
  });

  it("200 creates audit event when req.user is present", async () => {
    const user = await createTestUser({ username: `analog-update-event-${Date.now()}` });
    const analog = await Analog.create({
      konkName: "k",
      prodName: "p",
      url: "https://x.com",
      nameukr: "Old",
    });
    const req = {
      params: { id: analog._id.toString() },
      body: { nameukr: "New name" },
      user: { id: user._id.toString(), role: "ADMIN" },
    } as unknown as Request;
    await updateAnalogByIdController(req, res);
    expect(responseStatus.code).toBe(200);
    const events = await Event.find({ department: "analogs" });
    expect(events).toHaveLength(1);
    expect(events[0].userId.toString()).toBe(user._id.toString());
  });
});
