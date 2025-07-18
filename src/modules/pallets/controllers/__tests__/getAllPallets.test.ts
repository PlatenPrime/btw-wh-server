import { Request, Response } from "express";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Pallet } from "../../models/Pallet.js";
import { getAllPallets } from "../getAllPallets.js";

const createTestPallet = async (palletData: any = {}) => {
  return await Pallet.create({
    title: "Test Pallet",
    row: { _id: new Types.ObjectId(), title: "Test Row" },
    rowData: { _id: new Types.ObjectId(), title: "Test Row" },
    poses: [],
  });
};

describe("getAllPallets Controller", () => {
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

  it("should return all pallets", async () => {
    // Arrange
    await createTestPallet({ title: "A Pallet" });
    await createTestPallet({ title: "B Pallet" });
    mockRequest = {};

    // Act
    await getAllPallets(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(Array.isArray(responseJson)).toBe(true);
    expect(responseJson.length).toBe(2);
    expect(responseJson[0].title).toBeDefined();
  });

  it("should return 404 if no pallets found", async () => {
    // Arrange
    mockRequest = {};

    // Act
    await getAllPallets(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Pallets not found");
  });

  it("should handle server error", async () => {
    // Arrange
    vi.spyOn(Pallet, "find").mockRejectedValueOnce(new Error("DB error"));
    mockRequest = {};

    // Act
    await getAllPallets(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
    expect(responseJson.error).toBeDefined();
  });
});
