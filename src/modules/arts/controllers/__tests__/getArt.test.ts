import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestArt } from "../../../../test/setup.js";
import { getArt } from "../getArt.js";

describe("getArt Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: any;
  let responseStatus: any;

  beforeEach(() => {
    responseJson = {};
    responseStatus = {};

    mockResponse = {
      status: (code: number) => {
        responseStatus.code = code;
        return mockResponse;
      },
      json: (data: any) => {
        responseJson = data;
        return mockResponse;
      },
    };
  });

  it("should return art by artikul", async () => {
    // Arrange
    const testArt = await createTestArt({
      artikul: "TEST123",
      nameukr: "Test Art",
      namerus: "Тест Арт",
      zone: "A1",
      limit: 100,
    });

    mockRequest = {
      params: { artikul: "TEST123" },
    };

    // Act
    await getArt(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.artikul).toBe("TEST123");
    expect(responseJson.nameukr).toBe("Test Art");
    expect(responseJson.namerus).toBe("Тест Арт");
    expect(responseJson.zone).toBe("A1");
    expect(responseJson.limit).toBe(100);
    expect(responseJson._id).toBeDefined();
  });

  it("should return 404 when art not found", async () => {
    // Arrange
    mockRequest = {
      params: { artikul: "NONEXISTENT" },
    };

    // Act
    await getArt(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Art not found");
  });

  it("should handle case-sensitive search", async () => {
    // Arrange
    await createTestArt({
      artikul: "Test123",
      nameukr: "Test Art",
      zone: "A1",
    });

    mockRequest = {
      params: { artikul: "test123" }, // Different case
    };

    // Act
    await getArt(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Art not found");
  });

  it("should return art with btradeStock data", async () => {
    // Arrange
    const testArt = await createTestArt({
      artikul: "TEST456",
      nameukr: "Test Art",
      zone: "A1",
      btradeStock: {
        value: 50,
        date: new Date("2024-01-01"),
      },
    });

    mockRequest = {
      params: { artikul: "TEST456" },
    };

    // Act
    await getArt(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.artikul).toBe("TEST456");
    expect(responseJson.btradeStock).toBeDefined();
    expect(responseJson.btradeStock.value).toBe(50);
    expect(responseJson.btradeStock.date).toBeDefined();
  });

  it("should return art with marker", async () => {
    // Arrange
    const testArt = await createTestArt({
      artikul: "TEST789",
      nameukr: "Test Art",
      zone: "A1",
      marker: "IMPORTANT",
    });

    mockRequest = {
      params: { artikul: "TEST789" },
    };

    // Act
    await getArt(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.artikul).toBe("TEST789");
    expect(responseJson.marker).toBe("IMPORTANT");
  });

  it("should handle empty artikul parameter", async () => {
    // Arrange
    mockRequest = {
      params: { artikul: "" },
    };

    // Act
    await getArt(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Art not found");
  });

  it("should handle special characters in artikul", async () => {
    // Arrange
    const testArt = await createTestArt({
      artikul: "TEST-123_ABC",
      nameukr: "Test Art",
      zone: "A1",
    });

    mockRequest = {
      params: { artikul: "TEST-123_ABC" },
    };

    // Act
    await getArt(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.artikul).toBe("TEST-123_ABC");
  });

  it("should handle numeric artikul", async () => {
    // Arrange
    const testArt = await createTestArt({
      artikul: "123456",
      nameukr: "Test Art",
      zone: "A1",
    });

    mockRequest = {
      params: { artikul: "123456" },
    };

    // Act
    await getArt(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.artikul).toBe("123456");
  });

  it("should return timestamps", async () => {
    // Arrange
    const testArt = await createTestArt({
      artikul: "TIMESTAMP_TEST",
      nameukr: "Test Art",
      zone: "A1",
    });

    mockRequest = {
      params: { artikul: "TIMESTAMP_TEST" },
    };

    // Act
    await getArt(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.createdAt).toBeDefined();
    expect(responseJson.updatedAt).toBeDefined();
    expect(new Date(responseJson.createdAt)).toBeInstanceOf(Date);
    expect(new Date(responseJson.updatedAt)).toBeInstanceOf(Date);
  });
});
