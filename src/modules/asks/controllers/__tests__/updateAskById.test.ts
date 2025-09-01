import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestAsk, createTestUser } from "../../../../test/setup.js";
import { Ask } from "../../models/Ask.js";
import { updateAskById } from "../updateAskById.js";

// Mock the getCurrentFormattedDateTime utility to return a predictable format
vi.mock("../../../../utils/getCurrentFormattedDateTime.js", () => ({
  getCurrentFormattedDateTime: vi.fn(() => "15.01.2024 10:30"),
}));

describe("updateAskById Controller", () => {
  let mockRequest: Partial<Request>;
  let responseJson: any;
  let responseStatus: any;
  let res: Response;
  let testAsk: any;
  let testUser: any;
  let solverUser: any;

  beforeEach(async () => {
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

    // Create test users
    testUser = await createTestUser({
      username: "askeruser",
      fullname: "Asker User",
      telegram: "@askeruser",
      photo: "asker-photo.jpg",
    });

    solverUser = await createTestUser({
      username: "solveruser",
      fullname: "Solver User",
      telegram: "@solveruser",
      photo: "solver-photo.jpg",
    });

    // Create test ask
    testAsk = await createTestAsk({
      artikul: "TEST123",
      nameukr: "Test Product",
      quant: 10,
      com: "Test comment",
      asker: testUser._id,
      askerData: {
        _id: testUser._id,
        fullname: testUser.fullname,
        telegram: testUser.telegram,
        photo: testUser.photo,
      },
      status: "new",
      actions: ["15.01.2024 10:00 Asker User: створено запит"],
    });

    vi.clearAllMocks();
  });

  it("should update ask with valid data and add action", async () => {
    // Arrange
    mockRequest = {
      params: { id: testAsk._id },
      body: {
        solverId: solverUser._id,
        action: "почав обробку запиту",
      },
    };

    // Act  
    await updateAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.artikul).toBe("TEST123");
    expect(responseJson.nameukr).toBe("Test Product");
    expect(responseJson.quant).toBe(10);
    expect(responseJson.com).toBe("Test comment");
    expect(responseJson.status).toBe("new"); // Status should remain unchanged
    expect(responseJson.solver).toStrictEqual(solverUser._id);
    expect(responseJson.solverData).toBeDefined();
    expect(responseJson.solverData._id).toStrictEqual(solverUser._id);
    expect(responseJson.solverData.fullname).toBe("Solver User");
    expect(responseJson.solverData.telegram).toBe("@solveruser");
    expect(responseJson.solverData.photo).toBe("solver-photo.jpg");
    expect(responseJson.actions).toHaveLength(2);
    expect(responseJson.actions[0]).toBe(
      "15.01.2024 10:00 Asker User: створено запит"
    );
    expect(responseJson.actions[1]).toBe(
      "15.01.2024 10:30 Solver User: почав обробку запиту"
    );
  });

  it("should update ask with status change", async () => {
    // Arrange
    mockRequest = {
      params: { id: testAsk._id },
      body: {
        solverId: solverUser._id,
        action: "завершив обробку запиту",
        status: "completed",
      },
    };

    // Act
    await updateAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.status).toBe("completed");
    expect(responseJson.solver).toStrictEqual(solverUser._id);
    expect(responseJson.actions).toHaveLength(2);
    expect(responseJson.actions[1]).toBe(
      "15.01.2024 10:30 Solver User: завершив обробку запиту"
    );
  });

  it("should update ask with all valid statuses", async () => {
    const validStatuses = ["new", "in_progress", "completed", "cancelled"];

    for (const status of validStatuses) {
      // Arrange
      mockRequest = {
        params: { id: testAsk._id },
        body: {
          solverId: solverUser._id,
          action: `змінив статус на ${status}`,
          status: status as any,
        },
      };

      // Act
      await updateAskById(mockRequest as Request, res);

      // Assert
      expect(responseStatus.code).toBe(200);
      expect(responseJson.status).toBe(status);
    }
  });

  it("should return 400 when solverId is missing", async () => {
    // Arrange
    mockRequest = {
      params: { id: testAsk._id },
      body: {
        action: "почав обробку запиту",
      },
    };

    // Act
    await updateAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("solverId is required");
  });

  it("should return 400 when action is missing", async () => {
    // Arrange
    mockRequest = {
      params: { id: testAsk._id },
      body: {
        solverId: solverUser._id,
      },
    };

    // Act
    await updateAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("action is required");
  });

  it("should return 404 when ask not found", async () => {
    // Arrange
    const nonExistentId = new mongoose.Types.ObjectId();
    mockRequest = {
      params: { id: nonExistentId.toString() },
      body: {
        solverId: solverUser._id,
        action: "почав обробку запиту",
      },
    };

    // Act
    await updateAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Ask not found");
  });

  it("should return 404 when solver user not found", async () => {
    // Arrange
    const nonExistentUserId = new mongoose.Types.ObjectId();
    mockRequest = {
      params: { id: testAsk._id.toString() },
      body: {
        solverId: nonExistentUserId,
        action: "почав обробку запиту",
      },
    };

    // Act
    await updateAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Solver user not found");
  });

  it("should return 400 for invalid status", async () => {
    // Arrange
    mockRequest = {
      params: { id: testAsk._id.toString() },
      body: {
        solverId: solverUser._id,
        action: "спробував встановити невалідний статус",
        status: "invalid_status",
      },
    };

    // Act
    await updateAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe(
      "Invalid status. Must be one of: new, in_progress, completed, cancelled"
    );
  });

  it("should handle ask with existing actions and add new action", async () => {
    // Arrange - ask already has actions from beforeEach
    mockRequest = {
      params: { id: testAsk._id.toString() },
      body: {
        solverId: solverUser._id,
        action: "додав нову дію",
      },
    };

    // Act
    await updateAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.actions).toHaveLength(2);
    expect(responseJson.actions[0]).toBe(
      "15.01.2024 10:00 Asker User: створено запит"
    );
    expect(responseJson.actions[1]).toBe(
      "15.01.2024 10:30 Solver User: додав нову дію"
    );
  });

  it("should update ask without changing status when status not provided", async () => {
    // Arrange
    const originalStatus = testAsk.status;
    mockRequest = {
      params: { id: testAsk._id.toString() },
      body: {
        solverId: solverUser._id,
        action: "оновлю без зміни статусу",
      },
    };

    // Act
    await updateAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.status).toBe(originalStatus);
    expect(responseJson.solver).toStrictEqual(solverUser._id);
  });

  it("should return 500 for invalid ObjectId format", async () => {
    // Arrange
    mockRequest = {
      params: { id: "invalid-id-format" },
      body: {
        solverId: solverUser._id,
        action: "почав обробку запиту",
      },
    };

    // Act
    await updateAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
    expect(responseJson.error).toBeDefined();
  });

  it("should handle ask with empty actions array", async () => {
    // Arrange - create ask with no actions
    const emptyActionsAsk = await createTestAsk({
      artikul: "EMPTY123",
      nameukr: "Empty Actions Ask",
      asker: testUser._id,
      askerData: {
        _id: testUser._id,
        fullname: testUser.fullname,
        telegram: testUser.telegram,
        photo: testUser.photo,
      },
      actions: [],
    });

    mockRequest = {
      params: { id: emptyActionsAsk._id.toString() },
      body: {
        solverId: solverUser._id,
        action: "перша дія для пустого масиву",
      },
    };

    // Act
    await updateAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.actions).toHaveLength(1);
    expect(responseJson.actions[0]).toBe(
      "15.01.2024 10:30 Solver User: перша дія для пустого масиву"
    );
  });

  it("should preserve all existing ask fields during update", async () => {
    // Arrange
    mockRequest = {
      params: { id: testAsk._id.toString() },
      body: {
        solverId: solverUser._id,
        action: "оновлюю запит",
      },
    };

    // Act
    await updateAskById(mockRequest as Request, res);

    // Assert - all original fields should be preserved
    expect(responseJson.artikul).toBe(testAsk.artikul);
    expect(responseJson.nameukr).toBe(testAsk.nameukr);
    expect(responseJson.quant).toBe(testAsk.quant);
    expect(responseJson.com).toBe(testAsk.com);
    expect(responseJson.asker.toString()).toBe(testAsk.asker.toString());
    // Compare askerData fields individually to avoid Mongoose object comparison issues
    expect(responseJson.askerData._id).toStrictEqual(testAsk.askerData._id);
    expect(responseJson.askerData.fullname).toBe(testAsk.askerData.fullname);
    expect(responseJson.askerData.telegram).toBe(testAsk.askerData.telegram);
    expect(responseJson.askerData.photo).toBe(testAsk.askerData.photo);
    expect(responseJson.createdAt.getTime()).toBe(testAsk.createdAt.getTime());
    // updatedAt should be different due to the update
    expect(responseJson.updatedAt.getTime()).toBeGreaterThan(
      testAsk.updatedAt.getTime()
    );
  });

  it("should return 500 when findByIdAndUpdate returns null", async () => {
    // Arrange - mock Ask.findByIdAndUpdate to return null
    const mockFindByIdAndUpdate = vi
      .spyOn(Ask, "findByIdAndUpdate")
      .mockResolvedValueOnce(null);

    mockRequest = {
      params: { id: testAsk._id.toString() },
      body: {
        solverId: solverUser._id,
        action: "почав обробку запиту",
      },
    };

    // Act
    await updateAskById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Failed to update ask");

    // Cleanup
    mockFindByIdAndUpdate.mockRestore();
  });
});
