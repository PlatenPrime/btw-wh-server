import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Sku } from "../../models/Sku.js";
import { updateSkuByIdController } from "../update-sku-by-id/updateSkuByIdController.js";

describe("updateSkuByIdController", () => {
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

  it("400 for invalid id", async () => {
    const req = {
      params: { id: "bad-id" },
      body: { title: "New" },
    } as unknown as Request;
    await updateSkuByIdController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("200 updates sku", async () => {
    const sku = await Sku.create({
      konkName: "k1",
      prodName: "p1",
      productId: "k1-3",
      title: "Old",
      url: "https://k1.com/old-update",
    });
    const req = {
      params: { id: sku._id.toString() },
      body: { title: "New" },
    } as unknown as Request;
    await updateSkuByIdController(req, res);
    expect(responseStatus.code).toBe(200);
    expect((responseJson.data as { title: string }).title).toBe("New");
  });

  it("200 updates imageUrl", async () => {
    const sku = await Sku.create({
      konkName: "k1",
      prodName: "p1",
      productId: "k1-4",
      title: "T",
      url: "https://k1.com/u-img",
    });
    const req = {
      params: { id: sku._id.toString() },
      body: { imageUrl: "https://img.example/x.webp" },
    } as unknown as Request;
    await updateSkuByIdController(req, res);
    expect(responseStatus.code).toBe(200);
    expect(
      (responseJson.data as { imageUrl: string }).imageUrl,
    ).toBe("https://img.example/x.webp");
  });

  it("200 creates audit event when req.user is present", async () => {
    const user = await createTestUser({ username: `sku-update-event-${Date.now()}` });
    const sku = await Sku.create({
      konkName: "k1",
      prodName: "p1",
      productId: "k1-update-event",
      title: "Old",
      url: "https://k1.com/old-update-event",
    });
    const req = {
      params: { id: sku._id.toString() },
      body: { title: "New" },
      user: { id: user._id.toString(), role: "ADMIN" },
    } as unknown as Request;
    await updateSkuByIdController(req, res);
    expect(responseStatus.code).toBe(200);
    const events = await Event.find({ department: "skus" });
    expect(events).toHaveLength(1);
    expect(events[0].userId.toString()).toBe(user._id.toString());
  });
});
