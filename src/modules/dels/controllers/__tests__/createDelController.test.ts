import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Del } from "../../models/Del.js";
import { Prod } from "../../../prods/models/Prod.js";
import { createDelController } from "../create-del/createDelController.js";

describe("createDelController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Del.deleteMany({});
    await Prod.deleteMany({});
    await Event.deleteMany({});
    await Prod.create({
      name: "acme",
      title: "Acme",
      imageUrl: "https://example.com/acme.png",
    });
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

  it("400 when title missing", async () => {
    const req = { body: {} } as Request;
    await createDelController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("400 when prodName missing", async () => {
    const req = { body: { title: "New" } } as Request;
    await createDelController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("201 creates del and returns data", async () => {
    const req = {
      body: {
        title: "New",
        prodName: "acme",
        artikuls: [{ artikul: "ART-1", quantity: 10 }],
      },
    } as Request;
    await createDelController(req, res);
    expect(responseStatus.code).toBe(201);
    expect((responseJson.data as { title: string }).title).toBe("New");
    expect((responseJson.data as { prodName: string }).prodName).toBe("acme");
    expect((responseJson.data as { prod: { title: string; imageUrl: string } }).prod).toMatchObject({
      title: "Acme",
      imageUrl: "https://example.com/acme.png",
    });
    const count = await Del.countDocuments();
    expect(count).toBe(1);
  });

  it("201 creates audit event when req.user is present", async () => {
    const user = await createTestUser({ username: `del-create-event-${Date.now()}` });
    const req = {
      user: { id: String(user._id), role: "ADMIN" },
      body: {
        title: "Audited",
        prodName: "acme",
        artikuls: [],
      },
    } as unknown as Request;
    await createDelController(req, res);
    expect(responseStatus.code).toBe(201);
    const events = await Event.find({ department: "dels" });
    expect(events).toHaveLength(1);
    expect(events[0].userId.toString()).toBe(String(user._id));
    expect(events[0].description).toBe(
      'Створено поставку "Audited" від виробника acme'
    );
  });

  it("400 when prodName does not exist in Prod", async () => {
    const req = {
      body: { title: "New", prodName: "nonexistent" },
    } as Request;
    await createDelController(req, res);
    expect(responseStatus.code).toBe(400);
    expect((responseJson as { message: string }).message).toContain(
      "Производитель"
    );
  });
});
