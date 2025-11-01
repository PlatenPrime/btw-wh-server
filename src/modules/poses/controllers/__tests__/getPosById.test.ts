import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockRequest,
  createMockResponse,
  createTestPallet,
  createTestPos,
  createTestRow,
} from "../../../../test/utils/testHelpers.js";
import { Pos } from "../../models/Pos.js";
import { getPosById } from "../index.js";

describe("getPosById Controller", () => {
  let row: any;
  let pallet: any;
  let pos: any;

  beforeEach(async () => {
    row = await createTestRow();
    pallet = await createTestPallet({
      row: { _id: row._id, title: row.title },
    });
    pos = await createTestPos({
      pallet: { _id: pallet._id, title: pallet.title },
      row: { _id: row._id, title: row.title },
    });
  });

  it("should return pos by valid ID", async () => {
    const req = createMockRequest({ params: { id: pos._id.toString() } });
    const res = createMockResponse();
    await getPosById(req as any, res as any);
    expect(res.body.exists).toBe(true);
    expect(res.body.message).toBe("Position retrieved successfully");
    expect(res.body.data._id.toString()).toBe(pos._id.toString());
  });

  it("should return 404 if pos not found", async () => {
    const req = createMockRequest({
      params: { id: new mongoose.Types.ObjectId().toString() },
    });
    const res = createMockResponse();
    await getPosById(req as any, res as any);
    expect(res.statusCode).toBe(200);
    expect(res.body.exists).toBe(false);
    expect(res.body.message).toBe("Position not found");
    expect(res.body.data).toBe(null);
  });

  it("should return 400 for invalid ID", async () => {
    const req = createMockRequest({ params: { id: "invalid-id" } });
    const res = createMockResponse();
    await getPosById(req as any, res as any);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Invalid position ID");
  });

  it("should handle server error", async () => {
    const req = createMockRequest({ params: { id: pos._id.toString() } });
    const res = createMockResponse();
    vi.spyOn(Pos, "findById").mockImplementationOnce(() => {
      throw new Error("DB error");
    });
    await getPosById(req as any, res as any);
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe("Failed to fetch position");
  });
});
