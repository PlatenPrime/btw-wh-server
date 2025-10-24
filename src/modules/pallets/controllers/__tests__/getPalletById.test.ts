import { Request, Response } from "express";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Pallet } from "../../models/Pallet.js";
import { getPalletById } from "../getPalletById.js";

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

  it("should return pallet by valid ID", async () => {
    // Arrange
    const pallet = await Pallet.create({
      title: "Test Pallet",
      row: { _id: new Types.ObjectId(), title: "Test Row" },
      rowData: { _id: new Types.ObjectId(), title: "Test Row" },
      poses: [],
    });
    mockRequest = { params: { id: pallet.id } };

    // Act
    await getPalletById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(true);
    expect(responseJson.message).toBe("Pallet retrieved successfully");
    expect(responseJson.data.title).toBe("Test Pallet");
    expect(responseJson.data._id.toString()).toBe(pallet.id);
  });

  it("should return 404 if pallet not found", async () => {
    // Arrange
    mockRequest = { params: { id: new Types.ObjectId().toString() } };

    // Act
    await getPalletById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(false);
    expect(responseJson.message).toBe("Pallet not found");
    expect(responseJson.data).toBe(null);
  });

  it("should return 500 for invalid ID", async () => {
    // Arrange
    mockRequest = { params: { id: "invalid-id" } };

    // Act
    await getPalletById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
  });

  it("should handle server error", async () => {
    // Arrange
    const palletId = new Types.ObjectId().toString();
    mockRequest = { params: { id: palletId } };
    vi.spyOn(Pallet, "findById").mockRejectedValueOnce(new Error("DB error"));

    // Act
    await getPalletById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
    expect(responseJson.error).toBeDefined();
  });
});
