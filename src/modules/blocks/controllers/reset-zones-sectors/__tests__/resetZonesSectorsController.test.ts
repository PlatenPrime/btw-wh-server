import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../test/setup.js";
import { Event } from "../../../../events/models/Event.js";
import { Zone } from "../../../../zones/models/Zone.js";
import { resetZonesSectors } from "../resetZonesSectors.js";

describe("resetZonesSectorsController", () => {
  let res: Response;
  let responseJson: any;
  let responseStatus: any;

  beforeEach(() => {
    responseJson = {};
    responseStatus = {};
    res = {
      status: function (code: number) {
        responseStatus.code = code;
        return this;
      },
      json: function (data: any) {
        responseJson = data;
        return this;
      },
    } as unknown as Response;
  });

  it("200: resets all zones sectors to 0", async () => {
    await Zone.create({ title: "42-1-1", bar: 420101, sector: 1001 });
    await Zone.create({ title: "42-1-2", bar: 420102, sector: 2002 });

    const req = {} as unknown as Request;

    await resetZonesSectors(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Zones sectors reset successfully");
    expect(responseJson.data.matchedCount).toBe(2);
    expect(responseJson.data.modifiedCount).toBe(2);

    const zones = await Zone.find({}).lean().exec();
    expect(zones.every((zone) => zone.sector === 0)).toBe(true);
  });

  it("200: returns zero counts when no zones exist", async () => {
    const req = {} as unknown as Request;

    await resetZonesSectors(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.data.matchedCount).toBe(0);
    expect(responseJson.data.modifiedCount).toBe(0);
  });

  it("200: creates audit event when req.user is present", async () => {
    const user = await createTestUser({
      username: `reset-zones-sectors-event-${Date.now()}`,
    });
    const req = { user: { id: user._id.toString(), role: "ADMIN" } } as unknown as Request;

    await resetZonesSectors(req, res);

    expect(responseStatus.code).toBe(200);
    const events = await Event.find({ department: "blocks" });
    expect(events).toHaveLength(1);
  });
});
