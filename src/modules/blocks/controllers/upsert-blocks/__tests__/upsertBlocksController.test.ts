import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../test/setup.js";
import { Event } from "../../../../events/models/Event.js";
import { Block } from "../../../models/Block.js";
import { upsertBlocksController } from "../upsertBlocksController.js";

describe("upsertBlocksController", () => {
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

  it("200: upserts blocks successfully", async () => {
    const req = {
      body: [
        { title: "Block A", order: 1 },
        { title: "Block B", order: 2 },
      ],
    } as unknown as Request;

    await upsertBlocksController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Blocks upsert completed");
    expect(responseJson.data.updatedBlocks).toHaveLength(2);

    const blocks = await Block.find({}).sort({ order: 1 }).lean().exec();
    expect(blocks[0].title).toBe("Block A");
    expect(blocks[1].title).toBe("Block B");
  });

  it("200: creates audit event when req.user is present", async () => {
    const user = await createTestUser({
      username: `upsert-blocks-event-${Date.now()}`,
    });
    const req = {
      user: { id: user._id.toString(), role: "PRIME" },
      body: [
        { title: "Event Block A", order: 1 },
        { title: "Event Block B", order: 2 },
      ],
    } as unknown as Request;

    await upsertBlocksController(req, res);

    expect(responseStatus.code).toBe(200);
    const events = await Event.find({ department: "blocks" });
    expect(events).toHaveLength(1);
  });

  it("400: validation error for invalid payload", async () => {
    const req = {
      body: [{ title: "", order: 0 }],
    } as unknown as Request;

    await upsertBlocksController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
    expect(Array.isArray(responseJson.errors)).toBe(true);
  });

  it("500: server error on duplicate titles in payload", async () => {
    const req = {
      body: [
        { title: "Dup", order: 1 },
        { title: "dup", order: 2 },
      ],
    } as unknown as Request;

    await upsertBlocksController(req, res);

    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
  });
});
