import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { createAsk } from "../createAsk.js";

// Mock the getCurrentFormattedDateTime utility to return a predictable format
vi.mock("../../../utils/getCurrentFormattedDateTime.js", () => ({
  getCurrentFormattedDateTime: vi.fn(() => "15.01.2024 10:30"),
}));

describe("createAsk Controller", () => {
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

  it("should create ask with all required fields", async () => {
    // Arrange
    const testUser = await createTestUser({
      username: "testuser",
      fullname: "Test User",
      telegram: "@testuser",
      photo: "photo.jpg",
    });

    mockRequest = {
      body: {
        artikul: "TEST123",
        nameukr: "Test Product",
        quant: 10,
        com: "Test comment",
        askerId: testUser._id.toString(),
      },
    };

    // Act
    await createAsk(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(201);
    expect(responseJson.artikul).toBe("TEST123");
    expect(responseJson.nameukr).toBe("Test Product");
    expect(responseJson.quant).toBe(10);
    expect(responseJson.com).toBe("Test comment");
    expect(responseJson.asker.toString()).toBe(testUser._id.toString());
    expect(responseJson.status).toBe("new");
    expect(responseJson.askerData).toBeDefined();
    expect(responseJson.askerData.id).toBe(testUser._id.toString());
    expect(responseJson.askerData.fullname).toBe("Test User");
    expect(responseJson.askerData.telegram).toBe("@testuser");
    expect(responseJson.askerData.photo).toBe("photo.jpg");
    expect(responseJson.actions).toHaveLength(1);
    // Check that the action contains the expected format (more flexible)
    expect(responseJson.actions[0]).toMatch(/\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}/);
    expect(responseJson.actions[0]).toContain("Test User");
    expect(responseJson.actions[0]).toContain(
      "необхідно Test Product в кількості 10"
    );
    expect(responseJson.actions[0]).toContain("коментарій: Test comment");
    expect(responseJson._id).toBeDefined();
    expect(responseJson.createdAt).toBeDefined();
    expect(responseJson.updatedAt).toBeDefined();
  });

  it("should create ask with minimal required fields", async () => {
    // Arrange
    const testUser = await createTestUser({
      username: "minimaluser",
      fullname: "Minimal User",
    });

    mockRequest = {
      body: {
        artikul: "MIN123",
        askerId: testUser._id.toString(),
        // Only required fields
      },
    };

    // Act
    await createAsk(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(201);
    expect(responseJson.artikul).toBe("MIN123");
    expect(responseJson.nameukr).toBeUndefined();
    expect(responseJson.quant).toBeUndefined();
    expect(responseJson.com).toBeUndefined();
    expect(responseJson.asker.toString()).toBe(testUser._id.toString());
    expect(responseJson.status).toBe("new");
    expect(responseJson.askerData.id).toBe(testUser._id.toString());
    expect(responseJson.askerData.fullname).toBe("Minimal User");
    expect(responseJson.actions).toHaveLength(1);
    expect(responseJson.actions[0]).toContain(
      "необхідно undefined в кількості undefined"
    );
  });

  it("should create ask without comment", async () => {
    // Arrange
    const testUser = await createTestUser({
      username: "nocommentuser",
      fullname: "No Comment User",
    });

    mockRequest = {
      body: {
        artikul: "NOCOM123",
        nameukr: "No Comment Product",
        quant: 5,
        askerId: testUser._id.toString(),
        // No comment field
      },
    };

    // Act
    await createAsk(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(201);
    expect(responseJson.artikul).toBe("NOCOM123");
    expect(responseJson.nameukr).toBe("No Comment Product");
    expect(responseJson.quant).toBe(5);
    expect(responseJson.com).toBeUndefined();
    expect(responseJson.actions).toHaveLength(1);
    expect(responseJson.actions[0]).toContain(
      "необхідно No Comment Product в кількості 5"
    );
    expect(responseJson.actions[0]).not.toContain("коментарій:");
  });

  it("should create ask with empty comment", async () => {
    // Arrange
    const testUser = await createTestUser({
      username: "emptycommentuser",
      fullname: "Empty Comment User",
    });

    mockRequest = {
      body: {
        artikul: "EMPTYCOM123",
        nameukr: "Empty Comment Product",
        quant: 3,
        com: "",
        askerId: testUser._id.toString(),
      },
    };

    // Act
    await createAsk(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(201);
    expect(responseJson.artikul).toBe("EMPTYCOM123");
    expect(responseJson.com).toBe("");
    expect(responseJson.actions).toHaveLength(1);
    expect(responseJson.actions[0]).toContain(
      "необхідно Empty Comment Product в кількості 3"
    );
    expect(responseJson.actions[0]).not.toContain("коментарій:");
  });

  it("should return 404 when user not found", async () => {
    // Arrange
    const nonExistentUserId = new mongoose.Types.ObjectId().toString();
    mockRequest = {
      body: {
        artikul: "USERNOTFOUND123",
        nameukr: "User Not Found Product",
        quant: 1,
        askerId: nonExistentUserId,
      },
    };

    // Act
    await createAsk(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("User not found");
  });

  it("should handle empty askerId", async () => {
    // Arrange
    mockRequest = {
      body: {
        artikul: "EMPTYASKER123",
        nameukr: "Empty Asker Product",
        quant: 1,
        askerId: "",
      },
    };

    // Act
    await createAsk(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
    expect(responseJson.error).toBeDefined();
  });

  it("should handle undefined askerId", async () => {
    // Arrange
    mockRequest = {
      body: {
        artikul: "UNDEFINEDASKER123",
        nameukr: "Undefined Asker Product",
        quant: 1,
        // askerId is undefined
      },
    };

    // Act
    await createAsk(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("User not found");
  });

  it("should handle invalid askerId format", async () => {
    // Arrange
    mockRequest = {
      body: {
        artikul: "INVALIDASKER123",
        nameukr: "Invalid Asker Product",
        quant: 1,
        askerId: "invalid-id-format",
      },
    };

    // Act
    await createAsk(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
    expect(responseJson.error).toBeDefined();
  });

  it("should create ask with user having no telegram and photo", async () => {
    // Arrange
    const testUser = await createTestUser({
      username: "nofieldsuser",
      fullname: "No Fields User",
      // No telegram and photo
    });

    mockRequest = {
      body: {
        artikul: "NOFIELDS123",
        nameukr: "No Fields Product",
        quant: 7,
        askerId: testUser._id.toString(),
      },
    };

    // Act
    await createAsk(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(201);
    expect(responseJson.askerData.telegram).toBeUndefined();
    expect(responseJson.askerData.photo).toBeUndefined();
    expect(responseJson.askerData.fullname).toBe("No Fields User");
  });

  it("should create ask with zero quantity", async () => {
    // Arrange
    const testUser = await createTestUser({
      username: "zeroquantuser",
      fullname: "Zero Quant User",
    });

    mockRequest = {
      body: {
        artikul: "ZEROQUANT123",
        nameukr: "Zero Quant Product",
        quant: 0,
        askerId: testUser._id.toString(),
      },
    };

    // Act
    await createAsk(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(201);
    expect(responseJson.quant).toBe(0);
    expect(responseJson.actions[0]).toContain("в кількості 0");
  });

  it("should create ask with negative quantity", async () => {
    // Arrange
    const testUser = await createTestUser({
      username: "negquantuser",
      fullname: "Negative Quant User",
    });

    mockRequest = {
      body: {
        artikul: "NEGQUANT123",
        nameukr: "Negative Quant Product",
        quant: -5,
        askerId: testUser._id.toString(),
      },
    };

    // Act
    await createAsk(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(201);
    expect(responseJson.quant).toBe(-5);
    expect(responseJson.actions[0]).toContain("в кількості -5");
  });

  it("should create ask with very long comment", async () => {
    // Arrange
    const testUser = await createTestUser({
      username: "longcommentuser",
      fullname: "Long Comment User",
    });

    const longComment = "A".repeat(1000); // Very long comment

    mockRequest = {
      body: {
        artikul: "LONGCOM123",
        nameukr: "Long Comment Product",
        quant: 1,
        com: longComment,
        askerId: testUser._id.toString(),
      },
    };

    // Act
    await createAsk(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(201);
    expect(responseJson.com).toBe(longComment);
    expect(responseJson.actions[0]).toContain(`коментарій: ${longComment}`);
  });

  it("should create ask with special characters in fields", async () => {
    // Arrange
    const testUser = await createTestUser({
      username: "specialcharsuser",
      fullname: "Special Chars User",
    });

    mockRequest = {
      body: {
        artikul: "SPECIAL@#$%123",
        nameukr: "Продукт з спеціальними символами!@#$%^&*()",
        quant: 99,
        com: "Коментар з кирилицею та символами: !@#$%^&*()_+-=[]{}|;':\",./<>?",
        askerId: testUser._id.toString(),
      },
    };

    // Act
    await createAsk(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(201);
    expect(responseJson.artikul).toBe("SPECIAL@#$%123");
    expect(responseJson.nameukr).toBe(
      "Продукт з спеціальними символами!@#$%^&*()"
    );
    expect(responseJson.quant).toBe(99);
    expect(responseJson.com).toBe(
      "Коментар з кирилицею та символами: !@#$%^&*()_+-=[]{}|;':\",./<>?"
    );
  });

  it("should handle database error gracefully", async () => {
    // Arrange
    const testUser = await createTestUser({
      username: "dberroruser",
      fullname: "DB Error User",
    });

    // Mock Ask.save() to throw an error
    const originalSave = mongoose.Model.prototype.save;
    mongoose.Model.prototype.save = vi
      .fn()
      .mockRejectedValue(new Error("Database connection failed"));

    mockRequest = {
      body: {
        artikul: "DBERROR123",
        nameukr: "DB Error Product",
        quant: 1,
        askerId: testUser._id.toString(),
      },
    };

    // Act
    await createAsk(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
    expect(responseJson.error).toBeDefined();

    // Restore original save method
    mongoose.Model.prototype.save = originalSave;
  });
});
