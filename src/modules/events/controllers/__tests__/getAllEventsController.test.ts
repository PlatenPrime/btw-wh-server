import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../models/Event.js";
import { createEventUtil } from "../../utils/createEventUtil.js";
import { getAllEventsController } from "../get-all-events/getAllEventsController.js";

describe("getAllEventsController", () => {
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

  it("400 when page invalid", async () => {
    const req = { query: { page: "0" } } as unknown as Request;
    await getAllEventsController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("400 when userId invalid", async () => {
    const req = { query: { userId: "bad" } } as unknown as Request;
    await getAllEventsController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("200 returns events and pagination", async () => {
    const user = await createTestUser({ username: `ctrl-list-${Date.now()}` });
    await createEventUtil({
      userId: user._id.toString(),
      department: "constants",
      description: "Listed",
    });

    const req = { query: {} } as unknown as Request;
    await getAllEventsController(req, res);
    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Events retrieved successfully");
    expect(Array.isArray(responseJson.data)).toBe(true);
    expect((responseJson.data as unknown[]).length).toBe(1);
    expect(responseJson.pagination).toMatchObject({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
  });
});
