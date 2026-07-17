import { Request, Response } from "express";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../models/Event.js";
import { createEventUtil } from "../../utils/createEventUtil.js";
import { getEventByIdController } from "../get-event-by-id/getEventByIdController.js";

describe("getEventByIdController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
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
    const req = { params: { id: "bad" } } as unknown as Request;
    await getEventByIdController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("404 when event not found", async () => {
    const req = {
      params: { id: new Types.ObjectId().toString() },
    } as unknown as Request;
    await getEventByIdController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 returns event", async () => {
    const user = await createTestUser({ username: `ctrl-id-${Date.now()}` });
    const created = await createEventUtil({
      userId: user._id.toString(),
      department: "constants",
      type: "create",
      description: "By id",
    });

    const req = {
      params: { id: created!._id.toString() },
    } as unknown as Request;
    await getEventByIdController(req, res);
    expect(responseStatus.code).toBe(200);
    expect((responseJson.data as { description: string }).description).toBe(
      "By id"
    );
  });
});
