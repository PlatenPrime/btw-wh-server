import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Sku } from "../../models/Sku.js";
import { deleteSkuByIdController } from "../delete-sku-by-id/deleteSkuByIdController.js";

describe("deleteSkuByIdController", () => {
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
    const req = { params: { id: "bad-id" } } as unknown as Request;
    await deleteSkuByIdController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("200 deletes sku", async () => {
    const sku = await Sku.create({
      konkName: "k1",
      prodName: "p1",
      productId: "k1-5",
      title: "To delete",
      url: "https://k1.com/to-delete",
    });
    const req = { params: { id: sku._id.toString() } } as unknown as Request;
    await deleteSkuByIdController(req, res);
    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Sku deleted successfully");
  });

  it("200 creates audit event when req.user is present", async () => {
    const user = await createTestUser({ username: `sku-delete-event-${Date.now()}` });
    const sku = await Sku.create({
      konkName: "k1",
      prodName: "p1",
      productId: "k1-delete-event",
      title: "To delete",
      url: "https://k1.com/to-delete-event",
    });
    const req = {
      params: { id: sku._id.toString() },
      user: { id: user._id.toString(), role: "PRIME" },
    } as unknown as Request;
    await deleteSkuByIdController(req, res);
    expect(responseStatus.code).toBe(200);
    const events = await Event.find({ department: "skus" });
    expect(events).toHaveLength(1);
    expect(events[0].userId.toString()).toBe(user._id.toString());
  });
});
