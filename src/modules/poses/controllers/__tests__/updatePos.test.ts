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
import { updatePos } from "../updatePos.js";

describe("updatePos Controller", () => {
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

  it("should update pos by valid ID", async () => {
    const req = createMockRequest({
      params: { id: pos._id.toString() },
      body: {
        palletTitle: pallet.title,
        rowTitle: row.title,
        artikul: "UPDATED",
        quant: 99,
        boxes: 9,
      },
    });
    const res = createMockResponse();
    await updatePos(req as any, res as any);
    expect(res.body.artikul).toBe("UPDATED");
    expect(res.body.quant).toBe(99);
    expect(res.body.boxes).toBe(9);
  });

  it("should return 404 if pos not found", async () => {
    const req = createMockRequest({
      params: { id: new mongoose.Types.ObjectId().toString() },
      body: {
        palletTitle: pallet.title,
        rowTitle: row.title,
        artikul: "NOPE",
        quant: 1,
        boxes: 1,
      },
    });
    const res = createMockResponse();
    await updatePos(req as any, res as any);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Position not found");
  });

  it("should return 400 for invalid ID", async () => {
    const req = createMockRequest({
      params: { id: "invalid-id" },
      body: {
        palletTitle: pallet.title,
        rowTitle: row.title,
        artikul: "NOPE",
        quant: 1,
        boxes: 1,
      },
    });
    const res = createMockResponse();
    await updatePos(req as any, res as any);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Invalid position ID");
  });

  it("should handle server error", async () => {
    const req = createMockRequest({
      params: { id: pos._id.toString() },
      body: {
        palletTitle: pallet.title,
        rowTitle: row.title,
        artikul: "ERR",
        quant: 1,
        boxes: 1,
      },
    });
    const res = createMockResponse();
    vi.spyOn(Pos, "findByIdAndUpdate").mockImplementationOnce(() => {
      throw new Error("DB error");
    });
    await updatePos(req as any, res as any);
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe("Failed to update position");
  });
});
