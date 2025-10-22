import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestZone } from "../../../../test/setup.js";
import { getZoneById } from "../getZoneById.js";

describe("getZoneById Controller", () => {
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
  });

  it("should return zone by valid ObjectId", async () => {
    // Arrange
    const testZone = await createTestZone({
      title: "42-5-2",
      bar: 420502,
      sector: 0,
    });

    mockRequest = {
      params: { id: testZone._id.toString() },
    };

    // Act
    await getZoneById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Zone retrieved successfully");
    expect(responseJson.data.title).toBe("42-5-2");
    expect(responseJson.data.bar).toBe(420502);
    expect(responseJson.data.sector).toBe(0);
    expect(responseJson.data._id).toBeDefined();
  });

  it("should return 404 when zone not found", async () => {
    // Arrange
    const nonExistentId = new mongoose.Types.ObjectId();
    mockRequest = {
      params: { id: nonExistentId.toString() },
    };

    // Act
    await getZoneById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Zone not found");
  });

  it("should return 400 for invalid ObjectId format", async () => {
    // Arrange
    mockRequest = {
      params: { id: "invalid-id-format" },
    };

    // Act
    await getZoneById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Invalid zone ID format");
  });

  it("should return 400 for empty id parameter", async () => {
    // Arrange
    mockRequest = {
      params: { id: "" },
    };

    // Act
    await getZoneById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Invalid zone ID format");
  });

  it("should return 400 for undefined id parameter", async () => {
    // Arrange
    mockRequest = {
      params: {},
    };

    // Act
    await getZoneById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Invalid zone ID format");
  });

  it("should return zone with all fields populated", async () => {
    // Arrange
    const testZone = await createTestZone({
      title: "42-5-2",
      bar: 420502,
      sector: 1,
    });

    mockRequest = {
      params: { id: testZone._id.toString() },
    };

    // Act
    await getZoneById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data.title).toBe("42-5-2");
    expect(responseJson.data.bar).toBe(420502);
    expect(responseJson.data.sector).toBe(1);
    expect(responseJson.data.createdAt).toBeDefined();
    expect(responseJson.data.updatedAt).toBeDefined();
  });

  it("should return zone with different sector values", async () => {
    // Arrange
    const testZone = await createTestZone({
      title: "42-5-2",
      bar: 420502,
      sector: 999,
    });

    mockRequest = {
      params: { id: testZone._id.toString() },
    };

    // Act
    await getZoneById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data.sector).toBe(999);
  });

  it("should handle very long ObjectId", async () => {
    // Arrange
    const longId = "507f1f77bcf86cd799439011"; // Valid 24-character ObjectId
    mockRequest = {
      params: { id: longId },
    };

    // Act
    await getZoneById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Zone not found");
  });

  it("should handle ObjectId with special characters", async () => {
    // Arrange
    mockRequest = {
      params: { id: "507f1f77bcf86cd79943901!" }, // Invalid character
    };

    // Act
    await getZoneById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Invalid zone ID format");
  });

  it("should return timestamps", async () => {
    // Arrange
    const testZone = await createTestZone({
      title: "42-5-2",
      bar: 420502,
      sector: 0,
    });

    mockRequest = {
      params: { id: testZone._id.toString() },
    };

    // Act
    await getZoneById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data.createdAt).toBeDefined();
    expect(responseJson.data.updatedAt).toBeDefined();
    expect(new Date(responseJson.data.createdAt)).toBeInstanceOf(Date);
    expect(new Date(responseJson.data.updatedAt)).toBeInstanceOf(Date);
  });

  it("should handle zone with minimal required fields", async () => {
    // Arrange
    const testZone = await createTestZone({
      title: "42-1",
      bar: 4201,
      sector: 0,
    });

    mockRequest = {
      params: { id: testZone._id.toString() },
    };

    // Act
    await getZoneById(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data.title).toBe("42-1");
    expect(responseJson.data.bar).toBe(4201);
    expect(responseJson.data.sector).toBe(0);
    expect(responseJson.data._id).toBeDefined();
  });
});
