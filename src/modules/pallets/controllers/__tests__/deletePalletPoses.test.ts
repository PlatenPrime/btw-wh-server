import { Request, Response } from "express";
import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Pallet } from "../../models/Pallet.js";
import { deletePalletPoses } from "../deletePalletPoses.js";

describe("deletePalletPoses Controller", () => {
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

  it("should delete poses from a pallet", async () => {
    // Arrange
    const poseId = new Types.ObjectId();
    const pallet = await Pallet.create({
      title: "DeletePoses Pallet",
      row: { _id: new Types.ObjectId(), title: "Row" },
      poses: [poseId],
    });
    mockRequest = {
      body: {
        palletId: pallet.id,
        poses: [poseId.toString()],
      },
    };

    // Act
    await deletePalletPoses(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBeDefined();
  });

  it("should return 400 if palletId or poses missing", async () => {
    // Arrange
    mockRequest = { body: { poses: [new Types.ObjectId().toString()] } };
    await deletePalletPoses(mockRequest as Request, res);
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBeDefined();

    mockRequest = { body: { palletId: new Types.ObjectId().toString() } };
    await deletePalletPoses(mockRequest as Request, res);
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBeDefined();
  });

  it("should handle server error", async () => {
    // Arrange
    const poseId = new Types.ObjectId();
    const pallet = await Pallet.create({
      title: "DeletePoses Pallet",
      row: { _id: new Types.ObjectId(), title: "Row" },
      poses: [poseId],
    });
    mockRequest = {
      body: {
        palletId: pallet.id,
        poses: [poseId.toString()],
      },
    };
    vi.spyOn(Pallet.prototype, "save").mockRejectedValueOnce(
      new Error("DB error")
    );

    // Act
    await deletePalletPoses(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
    expect(responseJson.error).toBeDefined();
  });
});
