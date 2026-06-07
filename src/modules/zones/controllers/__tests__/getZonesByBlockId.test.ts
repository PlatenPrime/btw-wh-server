import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Block } from "../../../blocks/models/Block.js";
import { Seg } from "../../../segs/models/Seg.js";
import { Zone } from "../../models/Zone.js";
import { getZonesByBlockId } from "../get-zones-by-block-id/getZonesByBlockId.js";

describe("getZonesByBlockId Controller", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
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

  it("200 returns zones for valid block id", async () => {
    const block = await Block.create({ title: "Block A", order: 1, segs: [] });
    const zone = await Zone.create({ title: "42-1", bar: 4201, sector: 0 });
    await Seg.create({
      block: block._id,
      blockData: { _id: block._id, title: block.title },
      order: 1,
      sector: 0,
      zones: [{ _id: zone._id, title: zone.title }],
    });

    const req = {
      params: { blockId: block._id.toString() },
    } as unknown as Request;

    await getZonesByBlockId(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Zones retrieved successfully");
    expect((responseJson.data as unknown[]).length).toBe(1);
  });

  it("400 for invalid block id", async () => {
    const req = {
      params: { blockId: "invalid-id" },
    } as unknown as Request;

    await getZonesByBlockId(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Invalid block ID format");
  });

  it("200 returns empty array when block has no zones", async () => {
    const block = await Block.create({ title: "Block B", order: 1, segs: [] });

    const req = {
      params: { blockId: block._id.toString() },
    } as unknown as Request;

    await getZonesByBlockId(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toEqual([]);
  });
});
