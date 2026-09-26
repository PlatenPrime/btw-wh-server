import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../test/setup.js";
import { Event } from "../../../../events/models/Event.js";
import { NEWSKU_PROD_NAME } from "../../../../skus/constants/newskuProdName.js";
import { Sku } from "../../../../skus/models/Sku.js";
import { Skugr } from "../../../models/Skugr.js";
import { purgePromotedFromNewskuController } from "../purgePromotedFromNewskuController.js";

describe("purgePromotedFromNewskuController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Sku.deleteMany({});
    await Skugr.deleteMany({});
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

  it("200 returns stats after purging promoted skus", async () => {
    const kept = await Sku.create({
      konkName: "yumi",
      prodName: NEWSKU_PROD_NAME,
      productId: "yumi-ctrl-keep",
      title: "Keep",
      url: "https://yumi.example/ctrl-keep",
    });
    const promoted = await Sku.create({
      konkName: "yumi",
      prodName: "acme",
      productId: "yumi-ctrl-prom",
      title: "Prom",
      url: "https://yumi.example/ctrl-prom",
    });
    await Skugr.create({
      konkName: "yumi",
      prodName: NEWSKU_PROD_NAME,
      title: "Novinky",
      url: "https://yumi.example/ctrl-new",
      skus: [kept._id, promoted._id],
    });

    const req = {} as Request;
    await purgePromotedFromNewskuController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe(
      "Promoted skus purged from newsku groups successfully",
    );
    expect(responseJson.data).toEqual({
      groupsTotal: 1,
      groupsModified: 1,
      uniqueSkusRemoved: 1,
      linksRemoved: 1,
    });
  });

  it("200 creates audit event when req.user is present", async () => {
    const user = await createTestUser({
      username: `skugr-purge-newsku-event-${Date.now()}`,
    });
    const promoted = await Sku.create({
      konkName: "yumi",
      prodName: "acme",
      productId: "yumi-ctrl-event",
      title: "Prom",
      url: "https://yumi.example/ctrl-event",
    });
    await Skugr.create({
      konkName: "yumi",
      prodName: NEWSKU_PROD_NAME,
      title: "Novinky",
      url: "https://yumi.example/ctrl-event-g",
      skus: [promoted._id],
    });

    const req = {
      user: { id: user._id.toString(), role: "ADMIN" },
    } as unknown as Request;
    await purgePromotedFromNewskuController(req, res);

    expect(responseStatus.code).toBe(200);
    const events = await Event.find({ department: "skugrs" });
    expect(events).toHaveLength(1);
    expect(events[0].userId.toString()).toBe(user._id.toString());
    expect(events[0].type).toBe("edit");
  });
});
