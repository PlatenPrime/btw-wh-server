import { Request, Response } from "express";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Pallet } from "../../models/Pallet.js";
import { getPalletById } from "../getPalletById.js";

const createTestPallet = async (palletData: any = {}) => {
  return await Pallet.create({
    title: palletData.title || `Test Pallet ${Date.now()}`,
    row: palletData.row || { _id: new Types.ObjectId(), title: "Test Row" },
    poses: palletData.poses || [],
    sector: palletData.sector,
  });
};

describe("getPalletById Controller", () => {
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

  it("should return pallet by ID", async () => {
    // Arrange
    const testPallet = await createTestPallet({ title: "FindMe" });
    mockRequest = { params: { id: (testPallet._id as Types.ObjectId).toString() } };

    // Act
    await getPalletById(mockRequest as Request, res);

    // Assert
    const testPalletObj = testPallet.toObject();
    expect(responseStatus.code).toBe(200);
    expect(responseJson.title).toBe("FindMe");
    expect(responseJson._id).toBe(testPallet.id);
  });

  it("should return 404 for non-existent ID", async () => {
    // Arrange
    mockRequest = { params: { id: new Types.ObjectId().toString() } };

    // Act
    await getPalletById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Pallet not found");
  });

  it("should return 500 for invalid ID format", async () => {
    // Arrange
    mockRequest = { params: { id: "invalid-id" } };

    // Act
    await getPalletById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
  });
});
