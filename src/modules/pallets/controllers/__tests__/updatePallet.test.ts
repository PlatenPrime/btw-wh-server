import { Request, Response } from "express";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Pallet } from "../../models/Pallet.js";
import { updatePallet } from "../updatePallet.js";

const createTestPallet = async (palletData: any = {}) => {
  return await Pallet.create({
    title: palletData.title || `Test Pallet ${Date.now()}`,
    row: palletData.row || { _id: new Types.ObjectId(), title: "Test Row" },
    poses: palletData.poses || [],
    sector: palletData.sector,
  });
};

describe("updatePallet Controller", () => {
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

  it("should update pallet by ID", async () => {
    // Arrange
    const testPallet = await createTestPallet();
    mockRequest = {
      params: { id: testPallet.id },
      body: { title: "Updated Pallet" },
    };

    // Act
    await updatePallet(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.title).toBe("Updated Pallet");
  });

  it("should return 404 if pallet not found", async () => {
    // Arrange
    mockRequest = {
      params: { id: new Types.ObjectId().toString() },
      body: { title: "No Pallet" },
    };

    // Act
    await updatePallet(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Pallet not found");
  });

  it("should return 400 for invalid update data", async () => {
    // Arrange
    const testPallet = await createTestPallet();
    mockRequest = { params: { id: testPallet.id }, body: { title: "" } };

    // Act
    await updatePallet(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBeDefined();
  });

  it("should handle server error", async () => {
    // Arrange
    const testPallet = await createTestPallet();
    mockRequest = { params: { id: testPallet.id }, body: { title: "Err" } };
    vi.spyOn(Pallet, "findByIdAndUpdate").mockRejectedValueOnce(
      new Error("DB error")
    );

    // Act
    await updatePallet(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
    expect(responseJson.error).toBeDefined();
  });
});
