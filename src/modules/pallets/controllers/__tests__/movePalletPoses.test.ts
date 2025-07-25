import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../../../../test/setup";
import { Pos } from "../../../poses/models/Pos.js";
import { Row } from "../../../rows/models/Row.js";
import { Pallet } from "../../models/Pallet.js";
import { movePalletPoses } from "../movePalletPoses.js";

describe("movePalletPoses Controller", () => {
  let mockRequest: Partial<Request>;
  let responseJson: any;
  let responseStatus: any;
  let res: Response;
  let sessionMock: any;

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
    vi.clearAllMocks();
    // Мокаем startSession для тестов
    sessionMock = {
      withTransaction: async (fn: any) => await fn(),
      endSession: vi.fn(),
      inTransaction: () => false,
      options: { readPreference: { mode: "primary" } },
      client: {},
    };
    vi.spyOn(mongoose, "startSession").mockResolvedValue(sessionMock);

    // Удаляю моки findById/find, оставляю только patch .session на объектах
    // оставляю только финальные Query-like моки выше, удаляю patchSession и старые моки
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should move poses for a pallet", async () => {
    // Arrange
    const rowSource = { _id: new Types.ObjectId(), title: "Source Row" };
    const rowTarget = { _id: new Types.ObjectId(), title: "Target Row" };
    const sourcePallet = await Pallet.create({
      title: "Source Pallet",
      row: rowSource._id,
      rowData: { _id: rowSource._id, title: rowSource.title },
      poses: [],
    });
    const targetPallet = await Pallet.create({
      title: "Target Pallet",
      row: rowTarget._id,
      rowData: { _id: rowTarget._id, title: rowTarget.title },
      poses: [],
    });
    const pos = await Pos.create({
      pallet: sourcePallet._id,
      row: rowSource._id,
      palletData: { _id: sourcePallet._id, title: sourcePallet.title },
      rowData: { _id: rowSource._id, title: rowSource.title },
      palletTitle: sourcePallet.title,
      rowTitle: rowSource.title,
      artikul: "A-1",
      quant: 10,
      boxes: 1,
      limit: 100,
    });
    pos.save = vi.fn().mockResolvedValue(pos);
    sourcePallet.save = vi.fn().mockResolvedValue(sourcePallet);
    targetPallet.save = vi.fn().mockResolvedValue(targetPallet);
    sourcePallet.poses = [pos._id as Types.ObjectId];
    await sourcePallet.save();
    const freshSourcePallet = sourcePallet;
    // Helper for chainable, thenable Mongoose query mock
    function makeMongooseQueryMock(result: any) {
      const query = {
        session() {
          return query;
        },
        exec: async () => result,
        then: (resolve: any, reject: any) =>
          Promise.resolve(result).then(resolve, reject),
      };
      return query;
    }
    vi.spyOn(Pallet, "findById").mockImplementation(((id: any) =>
      makeMongooseQueryMock(
        id?.toString() === (freshSourcePallet._id as Types.ObjectId).toString()
          ? freshSourcePallet
          : id?.toString() === (targetPallet._id as Types.ObjectId).toString()
          ? targetPallet
          : null
      )) as any);
    vi.spyOn(Row, "findById").mockImplementation(((id: any) =>
      makeMongooseQueryMock(
        id?.toString() === rowSource._id.toString()
          ? rowSource
          : id?.toString() === rowTarget._id.toString()
          ? rowTarget
          : null
      )) as any);
    vi.spyOn(Pos, "find").mockImplementation(((query: any) =>
      makeMongooseQueryMock(
        query &&
          query._id &&
          Array.isArray(query._id.$in) &&
          query._id.$in[0]?.toString() ===
            (pos._id as Types.ObjectId).toString()
          ? [pos]
          : []
      )) as any);

    mockRequest = {
      body: {
        sourcePalletId: sourcePallet.id,
        targetPalletId: targetPallet.id,
      },
    };

    // Act
    await movePalletPoses(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBeDefined();

    // Восстанавливаем оригинальные методы
    (Pallet.findById as any).mockRestore &&
      (Pallet.findById as any).mockRestore();
    (Row.findById as any).mockRestore && (Row.findById as any).mockRestore();
    (Pos.find as any).mockRestore && (Pos.find as any).mockRestore();
  });

  it("should return 400 if sourcePalletId or targetPalletId missing", async () => {
    // Arrange
    mockRequest = { body: { targetPalletId: new Types.ObjectId().toString() } };
    await movePalletPoses(mockRequest as Request, res);
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBeDefined();

    mockRequest = { body: { sourcePalletId: new Types.ObjectId().toString() } };
    await movePalletPoses(mockRequest as Request, res);
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBeDefined();
  });

  it("should handle server error", async () => {
    // Arrange
    mockRequest = {
      body: {
        sourcePalletId: new Types.ObjectId().toString(),
        targetPalletId: new Types.ObjectId().toString(),
      },
    };
    vi.spyOn(Pallet, "findById").mockRejectedValueOnce(new Error("DB error"));

    // Act
    await movePalletPoses(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
    expect(responseJson.error).toBeDefined();
  });
});
