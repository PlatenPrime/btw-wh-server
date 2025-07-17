import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockRequest,
  createMockResponse,
  createTestPallet,
  createTestRow,
} from "../../../../test/utils/testHelpers.js";
import { Pos } from "../../models/Pos.js";
import { bulkCreatePoses } from "../bulkCreatePoses.js";

describe("bulkCreatePoses Controller", () => {
  let row: any;
  let pallet: any;

  beforeEach(async () => {
    row = await createTestRow();
    pallet = await createTestPallet({
      row: { _id: row._id, title: row.title },
    });
  });

  it("should create multiple poses with valid data", async () => {
    const req = createMockRequest({
      body: {
        poses: [
          {
            palletId: pallet._id.toString(),
            rowId: row._id.toString(),
            palletTitle: pallet.title,
            rowTitle: row.title,
            artikul: "BULK-1",
            quant: 10,
            boxes: 1,
          },
          {
            palletId: pallet._id.toString(),
            rowId: row._id.toString(),
            palletTitle: pallet.title,
            rowTitle: row.title,
            artikul: "BULK-2",
            quant: 20,
            boxes: 2,
          },
        ],
      },
    });
    const res = createMockResponse();
    await bulkCreatePoses(req as any, res as any);
    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].artikul).toBe("BULK-1");
    expect(res.body.data[1].artikul).toBe("BULK-2");
  });

  it("should return 404 if some pallets not found", async () => {
    const req = createMockRequest({
      body: {
        poses: [
          {
            palletId: new mongoose.Types.ObjectId().toString(),
            rowId: row._id.toString(),
            palletTitle: "No Pallet",
            rowTitle: row.title,
            artikul: "BULK-3",
            quant: 10,
            boxes: 1,
          },
        ],
      },
    });
    const res = createMockResponse();
    await bulkCreatePoses(req as any, res as any);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Some pallets not found");
  });

  it("should return 404 if some rows not found", async () => {
    const req = createMockRequest({
      body: {
        poses: [
          {
            palletId: pallet._id.toString(),
            rowId: new mongoose.Types.ObjectId().toString(),
            palletTitle: pallet.title,
            rowTitle: "No Row",
            artikul: "BULK-4",
            quant: 10,
            boxes: 1,
          },
        ],
      },
    });
    const res = createMockResponse();
    await bulkCreatePoses(req as any, res as any);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Some rows not found");
  });

  it("should return 400 for invalid data", async () => {
    const req = createMockRequest({ body: { poses: [] } });
    const res = createMockResponse();
    await bulkCreatePoses(req as any, res as any);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("should handle server error", async () => {
    const req = createMockRequest({
      body: {
        poses: [
          {
            palletId: pallet._id.toString(),
            rowId: row._id.toString(),
            palletTitle: pallet.title,
            rowTitle: row.title,
            artikul: "BULK-5",
            quant: 10,
            boxes: 1,
          },
        ],
      },
    });
    const res = createMockResponse();
    vi.spyOn(Pos, "create").mockImplementationOnce(() => {
      throw new Error("DB error");
    });
    await bulkCreatePoses(req as any, res as any);
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe("Failed to create positions");
  });
});
