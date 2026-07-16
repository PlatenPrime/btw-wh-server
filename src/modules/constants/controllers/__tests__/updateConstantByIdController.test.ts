import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Constant } from "../../models/Constant.js";
import { updateConstantByIdController } from "../update-constant-by-id/updateConstantByIdController.js";

describe("updateConstantByIdController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Constant.deleteMany({});
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
    await updateConstantByIdController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("404 when constant not found", async () => {
    const req = {
      params: { id: "000000000000000000000000" },
      body: { title: "New" },
    } as unknown as Request;
    await updateConstantByIdController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 updates and returns data", async () => {
    const constant = await Constant.create({
      name: "x",
      title: "Old",
      data: {},
    });
    const req = {
      params: { id: constant._id.toString() },
      body: { title: "New Title" },
    } as unknown as Request;
    await updateConstantByIdController(req, res);
    expect(responseStatus.code).toBe(200);
    expect((responseJson.data as { title: string }).title).toBe("New Title");
  });

  it("200 creates audit event when req.user is present", async () => {
    const user = await createTestUser({
      username: `upd-event-${Date.now()}`,
    });
    const constant = await Constant.create({
      name: "y",
      title: "Old",
      data: {},
    });
    const req = {
      user: { id: user._id.toString(), role: "ADMIN" },
      params: { id: constant._id.toString() },
      body: { title: "New" },
    } as unknown as Request;
    await updateConstantByIdController(req, res);
    expect(responseStatus.code).toBe(200);
    const events = await Event.find({ department: "constants" });
    expect(events).toHaveLength(1);
    expect(events[0].description).toContain("Оновлено константу");
    expect(events[0].description).toContain("name=y");
  });
});
