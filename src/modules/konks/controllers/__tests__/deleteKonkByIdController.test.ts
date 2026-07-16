import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Konk } from "../../models/Konk.js";
import { deleteKonkByIdController } from "../delete-konk-by-id/deleteKonkByIdController.js";

describe("deleteKonkByIdController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Konk.deleteMany({});
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
    const req = { params: { id: "invalid" } } as unknown as Request;
    await deleteKonkByIdController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("404 when konk not found", async () => {
    const req = {
      params: { id: "000000000000000000000000" },
    } as unknown as Request;
    await deleteKonkByIdController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 deletes konk", async () => {
    const konk = await Konk.create({
      name: "to-delete",
      title: "To Delete",
      url: "https://x.com",
      imageUrl: "https://x.com/1.png",
    });
    const req = { params: { id: konk._id.toString() } } as unknown as Request;
    await deleteKonkByIdController(req, res);
    expect(responseStatus.code).toBe(200);
    const found = await Konk.findById(konk._id);
    expect(found).toBeNull();
  });

  it("200 creates audit event when req.user is present", async () => {
    const user = await createTestUser({ username: `konk-delete-event-${Date.now()}` });
    const konk = await Konk.create({
      name: "to-delete-event",
      title: "To Delete",
      url: "https://x.com",
      imageUrl: "https://x.com/1.png",
    });
    const req = {
      params: { id: konk._id.toString() },
      user: { id: user._id.toString(), role: "PRIME" },
    } as unknown as Request;
    await deleteKonkByIdController(req, res);
    expect(responseStatus.code).toBe(200);
    const events = await Event.find({ department: "konks" });
    expect(events).toHaveLength(1);
    expect(events[0].userId.toString()).toBe(user._id.toString());
  });
});
