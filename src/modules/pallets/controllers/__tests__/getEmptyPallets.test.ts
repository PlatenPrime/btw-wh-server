import { Request, Response } from "express";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Pallet } from "../../models/Pallet.js";
import { getEmptyPallets } from "../getEmptyPallets.js";

const createTestPallet = async (palletData: any = {}) => {
  return await Pallet.create({
    title: `Test Pallet ${Math.random().toString(36).slice(2, 7)}`,
    row: { _id: new Types.ObjectId(), title: "Test Row" },
    rowData: { _id: new Types.ObjectId(), title: "Test Row" },
    poses: [],
    ...palletData,
  });
};

describe("getEmptyPallets Controller", () => {
  let mockRequest: Partial<Request>;
  let responseJson: any;
  let responseStatus: any;
  let res: Response;

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
  });

  it("should return pallets with empty poses", async () => {
    await createTestPallet({ poses: [] });
    await createTestPallet({ poses: [] });
    await createTestPallet({ poses: [new Types.ObjectId()] });
    mockRequest = {};

    await getEmptyPallets(mockRequest as Request, res);

    expect(responseStatus.code).toBe(200);
    expect(Array.isArray(responseJson)).toBe(true);
    expect(responseJson.length).toBe(2);
    expect(
      responseJson.every(
        (p: any) => Array.isArray(p.poses) && p.poses.length === 0
      )
    ).toBe(true);
  });

  it("should return 404 if no empty pallets found", async () => {
    await createTestPallet({ poses: [new Types.ObjectId()] });
    mockRequest = {};

    await getEmptyPallets(mockRequest as Request, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Empty pallets not found");
  });

  it("should handle server error", async () => {
    vi.spyOn(Pallet, "find").mockRejectedValueOnce(new Error("DB error"));
    mockRequest = {};

    await getEmptyPallets(mockRequest as Request, res);

    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
    expect(responseJson.error).toBeDefined();
  });
});
