import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../test/setup.js";
import { PalletGroup } from "../../../models/PalletGroup.js";
import { getAllPalletGroupsController } from "../getAllPalletGroupsController.js";

describe("getAllPalletGroupsController", () => {
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

  it("200: returns all groups sorted by order", async () => {
    await PalletGroup.create({ title: "Group B", order: 2, pallets: [] });
    await PalletGroup.create({ title: "Group A", order: 1, pallets: [] });

    const req = {} as Request;
    await getAllPalletGroupsController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Pallet groups fetched successfully");

    const data = responseJson.data as Array<{ title: string; order: number }>;
    expect(data).toHaveLength(2);
    expect(data[0].title).toBe("Group A");
    expect(data[1].title).toBe("Group B");
  });

  it("200: returns empty array when no groups exist", async () => {
    const req = {} as Request;
    await getAllPalletGroupsController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toEqual([]);
  });
});
