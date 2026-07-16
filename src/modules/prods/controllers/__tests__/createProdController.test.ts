import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Prod } from "../../models/Prod.js";
import { createProdController } from "../create-prod/createProdController.js";

describe("createProdController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Prod.deleteMany({});
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

  it("400 when name missing", async () => {
    const req = {
      body: { title: "Title", imageUrl: "https://x.com/1.png" },
    } as unknown as Request;
    await createProdController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("201 creates prod and returns data", async () => {
    const req = {
      body: {
        name: "acme",
        title: "Acme Corp",
        imageUrl: "https://example.com/acme.png",
      },
    } as unknown as Request;
    await createProdController(req, res);
    expect(responseStatus.code).toBe(201);
    expect((responseJson.data as { name: string }).name).toBe("acme");
    const count = await Prod.countDocuments();
    expect(count).toBe(1);
  });

  it("201 creates audit event when req.user is present", async () => {
    const user = await createTestUser({ username: `prod-event-${Date.now()}` });
    const req = {
      user: { id: user._id.toString(), role: "ADMIN" },
      body: {
        name: "audited",
        title: "Audited",
        imageUrl: "https://audited.com/1.png",
      },
    } as unknown as Request;
    await createProdController(req, res);
    expect(responseStatus.code).toBe(201);
    const events = await Event.find({ department: "prods" });
    expect(events).toHaveLength(1);
    expect(events[0].userId.toString()).toBe(user._id.toString());
  });
});
