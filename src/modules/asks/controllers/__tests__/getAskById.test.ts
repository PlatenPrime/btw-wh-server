import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestAsk } from "../../../../test/setup.js";
import { getAskById } from "../getAskById.js";

describe("getAskById Controller", () => {
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

  it("should return ask by valid ObjectId", async () => {
    // Arrange
    const testAsk = await createTestAsk({
      artikul: "TEST123",
      nameukr: "Test Ask",
      quant: 15,
      com: "Test comment for ask",
      status: "new",
    });

    mockRequest = {
      params: { id: testAsk._id.toString() },
    };

    // Act
    await getAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Ask retrieved successfully");
    expect(responseJson.data.artikul).toBe("TEST123");
    expect(responseJson.data.nameukr).toBe("Test Ask");
    expect(responseJson.data.quant).toBe(15);
    expect(responseJson.data.com).toBe("Test comment for ask");
    expect(responseJson.data.status).toBe("new");
    expect(responseJson.data._id).toBeDefined();
  });

  it("should return 404 when ask not found", async () => {
    // Arrange
    const nonExistentId = new mongoose.Types.ObjectId();
    mockRequest = {
      params: { id: nonExistentId.toString() },
    };

    // Act
    await getAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Ask not found");
  });

  it("should return 500 for invalid ObjectId format", async () => {
    // Arrange
    mockRequest = {
      params: { id: "invalid-id-format" },
    };

    // Act
    await getAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error while fetching ask");
    expect(responseJson.error).toBeDefined();
  });

  it("should return ask with all fields populated", async () => {
    // Arrange
    const testAsk = await createTestAsk({
      artikul: "FULL123",
      nameukr: "Full Test Ask",
      quant: 25,
      com: "Detailed comment",
      status: "in_progress",
      actions: ["action1", "action2"],
    });

    mockRequest = {
      params: { id: testAsk._id.toString() },
    };

    // Act
    await getAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data.artikul).toBe("FULL123");
    expect(responseJson.data.nameukr).toBe("Full Test Ask");
    expect(responseJson.data.quant).toBe(25);
    expect(responseJson.data.com).toBe("Detailed comment");
    expect(responseJson.data.status).toBe("in_progress");
    expect(responseJson.data.actions).toEqual(["action1", "action2"]);
    expect(responseJson.data.askerData).toBeDefined();
    expect(responseJson.data.askerData.fullname).toBe("Test User");
  });

  it("should return ask with different statuses", async () => {
    // Arrange
    const testAsk = await createTestAsk({
      artikul: "STATUS123",
      status: "completed",
    });

    mockRequest = {
      params: { id: testAsk._id.toString() },
    };

    // Act
    await getAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data.status).toBe("completed");
  });

  it("should handle empty id parameter", async () => {
    // Arrange
    mockRequest = {
      params: { id: "" },
    };

    // Act
    await getAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("ID is required");
  });

  it("should handle undefined id parameter", async () => {
    // Arrange
    mockRequest = {
      params: {},
    };

    // Act
    await getAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("ID is required");
  });

  it("should return timestamps", async () => {
    // Arrange
    const testAsk = await createTestAsk({
      artikul: "TIMESTAMP_TEST",
    });

    mockRequest = {
      params: { id: testAsk._id.toString() },
    };

    // Act
    await getAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data.createdAt).toBeDefined();
    expect(responseJson.data.updatedAt).toBeDefined();
    expect(new Date(responseJson.data.createdAt)).toBeInstanceOf(Date);
    expect(new Date(responseJson.data.updatedAt)).toBeInstanceOf(Date);
  });

  it("should handle ask with minimal required fields", async () => {
    // Arrange
    const testAsk = await createTestAsk({
      artikul: "MINIMAL",
      // Only required fields
    });

    mockRequest = {
      params: { id: testAsk._id.toString() },
    };

    // Act
    await getAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data.artikul).toBe("MINIMAL");
    expect(responseJson.data._id).toBeDefined();
    expect(responseJson.data.askerData).toBeDefined();
    expect(responseJson.data.status).toBe("new"); // Default value
  });

  it("should handle ask with solver data", async () => {
    // Arrange
    const testAsk = await createTestAsk({
      artikul: "SOLVER123",
      solverData: {
        id: "solver123",
        fullname: "Solver User",
        telegram: "@solver",
        photo: "photo.jpg",
      },
    });

    mockRequest = {
      params: { id: testAsk._id.toString() },
    };

    // Act
    await getAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data.solverData).toBeDefined();
    expect(responseJson.data.solverData.fullname).toBe("Solver User");
    expect(responseJson.data.solverData.telegram).toBe("@solver");
    expect(responseJson.data.solverData.photo).toBe("photo.jpg");
  });

  it("should handle very long ObjectId", async () => {
    // Arrange
    const longId = "507f1f77bcf86cd799439011"; // Valid 24-character ObjectId
    mockRequest = {
      params: { id: longId },
    };

    // Act
    await getAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Ask not found");
  });

  it("should handle ask with cancelled status", async () => {
    // Arrange
    const testAsk = await createTestAsk({
      artikul: "CANCELLED123",
      status: "cancelled",
    });

    mockRequest = {
      params: { id: testAsk._id.toString() },
    };

    // Act
    await getAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data.status).toBe("cancelled");
  });

  it("should handle ask with empty actions array", async () => {
    // Arrange
    const testAsk = await createTestAsk({
      artikul: "EMPTY_ACTIONS",
      actions: [],
    });

    mockRequest = {
      params: { id: testAsk._id.toString() },
    };

    // Act
    await getAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data.actions).toEqual([]);
  });
});
