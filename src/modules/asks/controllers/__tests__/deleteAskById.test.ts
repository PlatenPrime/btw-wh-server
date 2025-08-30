import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestAsk } from "../../../../test/setup.js";
import { deleteAskById } from "../deleteAskById.js";

describe("deleteAskById Controller", () => {
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

  it("should delete ask by valid ObjectId and return success", async () => {
    // Arrange
    const testAsk = await createTestAsk({
      artikul: "DELETE123",
      nameukr: "Test Ask to Delete",
      quant: 15,
      com: "Test comment for deletion",
      status: "new",
    });

    mockRequest = {
      params: { id: testAsk._id.toString() },
    };

    // Act
    await deleteAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Ask deleted successfully");
    expect(responseJson.data.id).toBe(testAsk._id.toString());
    expect(responseJson.data.artikul).toBe("DELETE123");

    // Verify ask was actually deleted from database
    const Ask = mongoose.model("Ask");
    const deletedAsk = await Ask.findById(testAsk._id);
    expect(deletedAsk).toBeNull();
  });

  it("should return 404 when ask not found", async () => {
    // Arrange
    const nonExistentId = new mongoose.Types.ObjectId();
    mockRequest = {
      params: { id: nonExistentId.toString() },
    };

    // Act
    await deleteAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Ask not found");
  });

  it("should return 400 when id parameter is missing", async () => {
    // Arrange
    mockRequest = {
      params: {},
    };

    // Act
    await deleteAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("ID is required");
  });

  it("should return 400 when id parameter is empty string", async () => {
    // Arrange
    mockRequest = {
      params: { id: "" },
    };

    // Act
    await deleteAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("ID is required");
  });

  it("should return 500 for invalid ObjectId format", async () => {
    // Arrange
    mockRequest = {
      params: { id: "invalid-id-format" },
    };

    // Act
    await deleteAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error while deleting ask");
    expect(responseJson.error).toBeDefined();
  });

  it("should handle very long ObjectId", async () => {
    // Arrange
    const longId = "507f1f77bcf86cd799439011"; // Valid 24-character ObjectId
    mockRequest = {
      params: { id: longId },
    };

    // Act
    await deleteAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Ask not found");
  });
});
