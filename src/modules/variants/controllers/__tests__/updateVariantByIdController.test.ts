import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Variant } from "../../models/Variant.js";
import { updateVariantByIdController } from "../update-variant-by-id/updateVariantByIdController.js";

describe("updateVariantByIdController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Variant.deleteMany({});
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
    await updateVariantByIdController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("400 when body empty", async () => {
    const variant = await Variant.create({
      konkName: "k",
      prodName: "p",
      title: "Old",
      url: "https://x.com",
      imageUrl: "https://example.com/old.png",
    });

    const req = {
      params: { id: variant._id.toString() },
      body: {},
    } as unknown as Request;

    await updateVariantByIdController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("404 when variant not found", async () => {
    const req = {
      params: { id: "000000000000000000000000" },
      body: { title: "New" },
    } as unknown as Request;

    await updateVariantByIdController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 updates variant", async () => {
    const variant = await Variant.create({
      konkName: "k",
      prodName: "p",
      title: "Old title",
      url: "https://x.com",
      imageUrl: "https://example.com/old.png",
    });

    const req = {
      params: { id: variant._id.toString() },
      body: { title: "New title" },
    } as unknown as Request;

    await updateVariantByIdController(req, res);
    expect(responseStatus.code).toBe(200);
    expect((responseJson.data as { title: string }).title).toBe(
      "New title"
    );
  });

  it("200 creates audit event when req.user is present", async () => {
    const user = await createTestUser({ username: `variant-update-event-${Date.now()}` });
    const variant = await Variant.create({
      konkName: "k",
      prodName: "p",
      title: "Old title",
      url: "https://x.com",
      imageUrl: "https://example.com/old.png",
    });

    const req = {
      params: { id: variant._id.toString() },
      body: { title: "New title" },
      user: { id: user._id.toString(), role: "ADMIN" },
    } as unknown as Request;

    await updateVariantByIdController(req, res);
    expect(responseStatus.code).toBe(200);
    const events = await Event.find({ department: "variants" });
    expect(events).toHaveLength(1);
    expect(events[0].userId.toString()).toBe(user._id.toString());
  });
});

