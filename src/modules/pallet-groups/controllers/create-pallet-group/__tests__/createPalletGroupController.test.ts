import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../test/setup.js";
import { Event } from "../../../../events/models/Event.js";
import { PalletGroup } from "../../../models/PalletGroup.js";
import { createPalletGroupController } from "../createPalletGroupController.js";

describe("createPalletGroupController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(() => {
    responseJson = {};
    responseStatus = {};
    res = {
      status(code: number) {
        responseStatus.code = code;
        return this;
      },
      json(data: Record<string, unknown>) {
        responseJson = data;
        return this;
      },
    } as unknown as Response;
  });

  it("201: creates pallet group successfully", async () => {
    const req = { body: { title: "New Group" } } as unknown as Request;

    await createPalletGroupController(req, res);

    expect(responseStatus.code).toBe(201);
    expect(responseJson.message).toBe("Pallet group created successfully");
    expect((responseJson.data as { title: string }).title).toBe("New Group");
    expect((responseJson.data as { order: number }).order).toBe(1);
    expect((responseJson.data as { id: string }).id).toBeDefined();
  });

  it("201: creates audit event when req.user is present", async () => {
    const user = await createTestUser({
      username: `create-pallet-group-event-${Date.now()}`,
    });
    const req = {
      user: { id: user._id.toString(), role: "ADMIN" },
      body: { title: "Event Group" },
    } as unknown as Request;

    await createPalletGroupController(req, res);

    expect(responseStatus.code).toBe(201);
    const events = await Event.find({ department: "pallet-groups" });
    expect(events).toHaveLength(1);
    expect(events[0].description).toContain("Event Group");
  });

  it("400: validation error when title is missing", async () => {
    const req = { body: {} } as unknown as Request;

    await createPalletGroupController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Invalid data");
    expect(Array.isArray(responseJson.errors)).toBe(true);
  });

  it("409: duplicate title detected before save", async () => {
    await PalletGroup.create({ title: "Existing Group", order: 1, pallets: [] });

    const req = { body: { title: "Existing Group" } } as unknown as Request;

    await createPalletGroupController(req, res);

    expect(responseStatus.code).toBe(409);
    expect(responseJson.message).toBe(
      "Pallet group with this title already exists",
    );
  });
});
