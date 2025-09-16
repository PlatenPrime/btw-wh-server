import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestAsk, createTestUser } from "../../../../test/setup.js";
import { Ask } from "../../models/Ask.js";
import { updateAskActionsById } from "../updateAskActionsById.js";

// Mock the getCurrentFormattedDateTime utility to return a predictable format
vi.mock("../../../../utils/getCurrentFormattedDateTime.js", () => ({
  getCurrentFormattedDateTime: vi.fn(() => "15.01.2024 10:30"),
}));

describe("updateAskActionsById Controller", () => {
  let mockRequest: Partial<Request>;
  let responseJson: any;
  let responseStatus: any;
  let res: Response;
  let testAsk: any;
  let testUser: any;
  let actionUser: any;

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

    actionUser = await createTestUser({
      username: "actionuser",
      fullname: "Action User",
      telegram: "@actionuser",
      photo: "action-photo.jpg",
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

  it("should add new action to ask with valid action and userId", async () => {
    // Arrange
    mockRequest = {
      params: { id: testAsk._id },
      body: {
        action: "додав коментар",
        userId: actionUser._id,
      },
    };

    // Act
    await updateAskActionsById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.artikul).toBe("TEST123");
    expect(responseJson.nameukr).toBe("Test Product");
    expect(responseJson.quant).toBe(10);
    expect(responseJson.com).toBe("Test comment");
    expect(responseJson.status).toBe("new");
    expect(responseJson.actions).toHaveLength(2);
    expect(responseJson.actions[0]).toBe(
      "15.01.2024 10:00 Asker User: створено запит"
    );
    expect(responseJson.actions[1]).toBe(
      "15.01.2024 10:30 Action User: додав коментар"
    );
  });

  it("should add multiple actions to ask", async () => {
    // Arrange
    mockRequest = {
      params: { id: testAsk._id },
      body: {
        action: "перша дія",
        userId: actionUser._id,
      },
    };

    // Act
    await updateAskActionsById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.actions).toHaveLength(2);
    expect(responseJson.actions[1]).toBe(
      "15.01.2024 10:30 Action User: перша дія"
    );

    // Add second action
    mockRequest = {
      params: { id: testAsk._id },
      body: {
        action: "друга дія",
        userId: actionUser._id,
      },
    };

    await updateAskActionsById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.actions).toHaveLength(3);
    expect(responseJson.actions[2]).toBe(
      "15.01.2024 10:30 Action User: друга дія"
    );
  });

  it("should return 400 when action is missing", async () => {
    // Arrange
    mockRequest = {
      params: { id: testAsk._id },
      body: {
        userId: actionUser._id,
      },
    };

    // Act
    await updateAskActionsById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("action is required");
  });

  it("should return 400 when userId is missing", async () => {
    // Arrange
    mockRequest = {
      params: { id: testAsk._id },
      body: {
        action: "додав коментар",
      },
    };

    // Act
    await updateAskActionsById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("userId is required");
  });

  it("should return 400 when both action and userId are missing", async () => {
    // Arrange
    mockRequest = {
      params: { id: testAsk._id },
      body: {},
    };

    // Act
    await updateAskActionsById(mockRequest as Request, res);

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
        action: "додав коментар",
        userId: actionUser._id,
      },
    };

    // Act
    await updateAskActionsById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Ask not found");
  });

  it("should return 404 when user not found", async () => {
    // Arrange
    const nonExistentUserId = new mongoose.Types.ObjectId();
    mockRequest = {
      params: { id: testAsk._id.toString() },
      body: {
        action: "додав коментар",
        userId: nonExistentUserId,
      },
    };

    // Act
    await updateAskActionsById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("User not found");
  });

  it("should handle empty action string", async () => {
    // Arrange
    mockRequest = {
      params: { id: testAsk._id },
      body: {
        action: "",
        userId: actionUser._id,
      },
    };

    // Act
    await updateAskActionsById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("action is required");
  });

  it("should handle special characters in action", async () => {
    // Arrange
    mockRequest = {
      params: { id: testAsk._id },
      body: {
        action: "додав коментар: 'спеціальні символи!@#$%^&*()'",
        userId: actionUser._id,
      },
    };

    // Act
    await updateAskActionsById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.actions).toHaveLength(2);
    expect(responseJson.actions[1]).toBe(
      "15.01.2024 10:30 Action User: додав коментар: 'спеціальні символи!@#$%^&*()'"
    );
  });

  it("should handle long action text", async () => {
    // Arrange
    const longAction = "a".repeat(1000);
    mockRequest = {
      params: { id: testAsk._id },
      body: {
        action: longAction,
        userId: actionUser._id,
      },
    };

    // Act
    await updateAskActionsById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.actions).toHaveLength(2);
    expect(responseJson.actions[1]).toBe(
      `15.01.2024 10:30 Action User: ${longAction}`
    );
  });

  it("should preserve existing actions when adding new one", async () => {
    // Arrange - first add an action
    mockRequest = {
      params: { id: testAsk._id },
      body: {
        action: "перша дія",
        userId: actionUser._id,
      },
    };

    await updateAskActionsById(mockRequest as Request, res);
    const firstUpdate = responseJson;

    // Add second action
    mockRequest = {
      params: { id: testAsk._id },
      body: {
        action: "друга дія",
        userId: actionUser._id,
      },
    };

    await updateAskActionsById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.actions).toHaveLength(3);
    expect(responseJson.actions[0]).toBe(firstUpdate.actions[0]);
    expect(responseJson.actions[1]).toBe(firstUpdate.actions[1]);
    expect(responseJson.actions[2]).toBe(
      "15.01.2024 10:30 Action User: друга дія"
    );
  });

  it("should handle database error gracefully", async () => {
    // Arrange
    const originalFindByIdAndUpdate = Ask.findByIdAndUpdate;
    vi.spyOn(Ask, "findByIdAndUpdate").mockRejectedValueOnce(
      new Error("Database connection failed")
    );

    mockRequest = {
      params: { id: testAsk._id },
      body: {
        action: "додав коментар",
        userId: actionUser._id,
      },
    };

    // Act
    await updateAskActionsById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");

    // Restore original method
    Ask.findByIdAndUpdate = originalFindByIdAndUpdate;
  });

  it("should handle invalid ObjectId format", async () => {
    // Arrange
    mockRequest = {
      params: { id: "invalid-id" },
      body: {
        action: "додав коментар",
        userId: actionUser._id,
      },
    };

    // Act
    await updateAskActionsById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
  });

  it("should handle invalid userId ObjectId format", async () => {
    // Arrange
    mockRequest = {
      params: { id: testAsk._id },
      body: {
        action: "додав коментар",
        userId: "invalid-user-id",
      },
    };

    // Act
    await updateAskActionsById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
  });
});
