import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import {
  createMockRequest,
  createMockResponse,
  createTestPallet,
  createTestRow,
} from "../../../../test/utils/testHelpers.js";
import { Event } from "../../../events/models/Event.js";
import { Pos } from "../../models/Pos.js";
import { createPos } from "../index.js";

describe("createPos Controller", () => {
  let row: any;
  let pallet: any;

  beforeEach(async () => {
    row = await createTestRow();
    pallet = await createTestPallet({
      row: { _id: row._id, title: row.title },
    });
  });

  it("should create a pos with valid data", async () => {
    const req = createMockRequest({
      body: {
        palletId: pallet._id.toString(),
        rowId: row._id.toString(),
        artikul: "ART-1",
        quant: 5,
        boxes: 2,
        sklad: "merezhi",
        date: "04.21",
      },
    });
    const res = createMockResponse();
    await createPos(req as any, res as any);
    expect(res.statusCode).toBe(201);
    expect(res.body.artikul).toBe("ART-1");
    expect(res.body.sklad).toBe("merezhi");
    expect(res.body.date).toBe("04.21");
    expect(res.body.palletData._id.toString()).toBe(pallet._id.toString());
    expect(res.body.rowData._id.toString()).toBe(row._id.toString());
    expect(res.body.palletData.isDef).toBe(pallet.isDef);
  });

  it("should return 404 if pallet not found", async () => {
    const req = createMockRequest({
      body: {
        palletId: new mongoose.Types.ObjectId().toString(),
        rowId: row._id.toString(),
        artikul: "ART-2",
        quant: 5,
        boxes: 2,
      },
    });
    const res = createMockResponse();
    await createPos(req as any, res as any);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Pallet not found");
  });

  it("should return 404 if row not found", async () => {
    const req = createMockRequest({
      body: {
        palletId: pallet._id.toString(),
        rowId: new mongoose.Types.ObjectId().toString(),
        artikul: "ART-3",
        quant: 5,
        boxes: 2,
      },
    });
    const res = createMockResponse();
    await createPos(req as any, res as any);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Row not found");
  });

  // it("should return 400 for invalid data", async () => {
  //   const req = createMockRequest({
  //     body: {
  //       palletId: "invalid",
  //       rowId: row._id.toString(),
  //       artikul: "ART-4",
  //       quant: 5,
  //       boxes: 2,
  //     },
  //   });
  //   const res = createMockResponse();
  //   await createPos(req as any, res as any);
  //   expect(res.statusCode).toBe(400);
  //   expect(res.body.error).toBeDefined();
  // });

  it("should handle server error", async () => {
    const req = createMockRequest({
      body: {
        palletId: pallet._id.toString(),
        rowId: row._id.toString(),
        artikul: "ART-5",
        quant: 5,
        boxes: 2,
      },
    });
    const res = createMockResponse();
    vi.spyOn(Pos, "create").mockImplementationOnce(() => {
      throw new Error("DB error");
    });
    await createPos(req as any, res as any);
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe("Failed to create position");
  });

  it("should create an audit event when req.user is present", async () => {
    const user = await createTestUser({ username: `pos-event-${Date.now()}` });
    const req = createMockRequest({
      user: { id: user._id.toString(), role: "ADMIN" },
      body: {
        palletId: pallet._id.toString(),
        rowId: row._id.toString(),
        artikul: "ART-EVENT",
        quant: 5,
        boxes: 2,
      },
    });
    const res = createMockResponse();
    await createPos(req as any, res as any);
    expect(res.statusCode).toBe(201);
    const events = await Event.find({ department: "poses" });
    expect(events).toHaveLength(1);
    expect(events[0].userId.toString()).toBe(user._id.toString());
    expect(events[0].description).toContain("ART-EVENT");
  });

  it("should create a pos with isDef field in palletData", async () => {
    const palletWithIsDef = await createTestPallet({
      row: { _id: row._id, title: row.title },
      isDef: true,
    });
    const req = createMockRequest({
      body: {
        palletId: palletWithIsDef._id.toString(),
        rowId: row._id.toString(),
        artikul: "ART-DEF",
        quant: 3,
        boxes: 1,
      },
    });
    const res = createMockResponse();
    await createPos(req as any, res as any);
    expect(res.statusCode).toBe(201);
    expect(res.body.palletData.isDef).toBe(true);
  });
});
