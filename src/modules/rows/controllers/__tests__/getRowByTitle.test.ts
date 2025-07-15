import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Row } from "../../models/Row.js";
import { getRowByTitle } from "../getRowByTitle.js";

describe("getRowByTitle Controller", () => {
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

  it("should return row by title", async () => {
    // Arrange
    const row = await Row.create({ title: "UniqueTitle" });
    mockRequest = { params: { title: "UniqueTitle" } };

    // Act
    await getRowByTitle(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.title).toBe("UniqueTitle");
    expect(responseJson._id).toBeDefined();
  });

  it("should return 404 if row not found", async () => {
    // Arrange
    mockRequest = { params: { title: "NotExist" } };

    // Act
    await getRowByTitle(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Row not found");
  });

  it("should handle server error", async () => {
    // Arrange
    vi.spyOn(Row, "findOne").mockRejectedValueOnce(new Error("DB error"));
    mockRequest = { params: { title: "Any" } };

    // Act
    await getRowByTitle(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
    expect(responseJson.error).toBeDefined();
  });
});
