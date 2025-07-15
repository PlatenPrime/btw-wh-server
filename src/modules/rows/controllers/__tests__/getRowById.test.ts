import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Row } from "../../models/Row.js";
import { getRowById } from "../getRowById.js";
import { Types } from "mongoose";

describe("getRowById Controller", () => {
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

  it("should return row by id", async () => {
    // Arrange
    const row = await Row.create({ title: "Row by ID" });
    mockRequest = { params: { id: (row._id as Types.ObjectId).toString() } };

    // Act
    await getRowById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.title).toBe("Row by ID");
    expect(responseJson._id).toBeDefined();
  });

  it("should return 404 if row not found", async () => {
    // Arrange
    mockRequest = { params: { id: "000000000000000000000000" } };

    // Act
    await getRowById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Row not found");
  });

  it("should handle server error", async () => {
    // Arrange
    vi.spyOn(Row, "findById").mockRejectedValueOnce(new Error("DB error"));
    mockRequest = { params: { id: "123" } };

    // Act
    await getRowById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
    expect(responseJson.error).toBeDefined();
  });
});
