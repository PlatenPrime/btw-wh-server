import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../test/setup.js";
import { PalletGroup } from "../../../models/PalletGroup.js";
import { reorderPalletGroupsController } from "../reorderPalletGroupsController.js";

describe("reorderPalletGroupsController", () => {
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

  it("200: reorders groups successfully", async () => {
    const g1 = await PalletGroup.create({
      title: "Group A",
      order: 1,
      pallets: [],
    });
    const g2 = await PalletGroup.create({
      title: "Group B",
      order: 2,
      pallets: [],
    });

    const req = {
      body: {
        orders: [
          { id: g1._id.toString(), order: 2 },
          { id: g2._id.toString(), order: 1 },
        ],
      },
    } as unknown as Request;

    await reorderPalletGroupsController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Pallet groups order updated successfully");
    expect((responseJson.data as { updatedCount: number }).updatedCount).toBe(2);
  });

  it("400: validation error when orders is missing", async () => {
    const req = { body: {} } as unknown as Request;

    await reorderPalletGroupsController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Invalid data");
  });
});
