import { Request, Response } from "express";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Pallet } from "../../models/Pallet.js";
import { getAllPalletsByRowId } from "../getAllPalletsByRowId.js";

const createTestPallet = async (
  rowId: Types.ObjectId,
  palletData: any = {}
) => {
  return await Pallet.create({
    title: palletData.title || `Test Pallet ${Date.now()}`,
    row: rowId,
    rowData: { _id: rowId, title: "Test Row" },
    poses: palletData.poses || [],
    sector: palletData.sector,
  });
};

describe("getAllPalletsByRowId Controller", () => {
  let mockRequest: Partial<Request>;
  let responseJson: any;
  let responseStatus: any;
  let res: Response;
  let testRowId: Types.ObjectId;

  beforeEach(async () => {
    await Pallet.deleteMany({});
    testRowId = new Types.ObjectId();
  });

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

  it("should return all pallets for a rowId", async () => {
    // Arrange
    await createTestPallet(testRowId, { title: "Row Pallet 1" });
    await createTestPallet(testRowId, { title: "Row Pallet 2" });
    mockRequest = { params: { rowId: testRowId.toString() } };

    // Act
    await getAllPalletsByRowId(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(Array.isArray(responseJson)).toBe(true);
    expect(responseJson.length).toBe(2);
    expect(responseJson[0].row._id.toString()).toBe(testRowId.toString());
    expect(responseJson[0].rowData._id.toString()).toBe(testRowId.toString());
    expect(responseJson[0].rowData.title).toBe("Test Row");
  });

  it("should return 404 if no pallets found for rowId", async () => {
    // Arrange
    mockRequest = { params: { rowId: testRowId.toString() } };

    // Act
    await getAllPalletsByRowId(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Pallets not found");
  });

  it("should handle server error", async () => {
    // Arrange
    mockRequest = { params: { rowId: testRowId.toString() } };
    vi.spyOn(Pallet, "find").mockRejectedValueOnce(new Error("DB error"));

    // Act
    await getAllPalletsByRowId(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
    expect(responseJson.error).toBeDefined();
  });
});
