import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestZone } from "../../../../test/setup.js";
import { getZoneByTitle } from "../getZoneByTitle.js";

describe("getZoneByTitle Controller", () => {
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

  it("should return zone by valid title", async () => {
    // Arrange
    const testZone = await createTestZone({
      title: "42-5-2",
      bar: 420502,
      sector: 0,
    });

    mockRequest = {
      params: { title: "42-5-2" },
    };

    // Act
    await getZoneByTitle(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(true);
    expect(responseJson.message).toBe("Zone retrieved successfully");
    expect(responseJson.data.title).toBe("42-5-2");
    expect(responseJson.data.bar).toBe(420502);
    expect(responseJson.data.sector).toBe(0);
    expect(responseJson.data._id).toBeDefined();
  });

  it("should return 404 when zone not found", async () => {
    // Arrange
    mockRequest = {
      params: { title: "99-99-99" },
    };

    // Act
    await getZoneByTitle(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(false);
    expect(responseJson.message).toBe("Zone not found");
    expect(responseJson.data).toBe(null);
  });

  it("should return 400 for empty title parameter", async () => {
    // Arrange
    mockRequest = {
      params: { title: "" },
    };

    // Act
    await getZoneByTitle(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Title is required");
  });

  it("should return 400 for undefined title parameter", async () => {
    // Arrange
    mockRequest = {
      params: {},
    };

    // Act
    await getZoneByTitle(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Title is required");
  });

  it("should return 400 for whitespace-only title", async () => {
    // Arrange
    mockRequest = {
      params: { title: "   " },
    };

    // Act
    await getZoneByTitle(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Title is required");
  });

  it("should return zone with different title formats", async () => {
    const testCases = [
      { title: "42-1", bar: 4201, sector: 1 },
      { title: "22-5-1", bar: 22501, sector: 2 },
      { title: "42-13-2", bar: 421302, sector: 3 },
      { title: "1", bar: 1, sector: 4 },
      { title: "99-99-99", bar: 999999, sector: 5 },
    ];

    for (const testCase of testCases) {
      // Arrange
      const testZone = await createTestZone({
        title: testCase.title,
        bar: testCase.bar,
        sector: testCase.sector,
      });

      mockRequest = {
        params: { title: testCase.title },
      };

      // Act
      await getZoneByTitle(mockRequest as Request, res);

      // Assert
      expect(responseStatus.code).toBe(200);
      expect(responseJson.exists).toBe(true);
      expect(responseJson.message).toBe("Zone retrieved successfully");
      expect(responseJson.data.title).toBe(testCase.title);
      expect(responseJson.data.bar).toBe(testCase.bar);
    }
  });

  it("should handle title with leading/trailing whitespace", async () => {
    // Arrange
    const testZone = await createTestZone({
      title: "42-5-2",
      bar: 420502,
      sector: 0,
    });

    mockRequest = {
      params: { title: "  42-5-2  " }, // with whitespace
    };

    // Act
    await getZoneByTitle(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data.title).toBe("42-5-2");
  });

  it("should return zone with all fields populated", async () => {
    // Arrange
    const testZone = await createTestZone({
      title: "42-5-2",
      bar: 420502,
      sector: 1,
    });

    mockRequest = {
      params: { title: "42-5-2" },
    };

    // Act
    await getZoneByTitle(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(true);
    expect(responseJson.message).toBe("Zone retrieved successfully");
    expect(responseJson.data.title).toBe("42-5-2");
    expect(responseJson.data.bar).toBe(420502);
    expect(responseJson.data.sector).toBe(1);
    expect(responseJson.data.createdAt).toBeDefined();
    expect(responseJson.data.updatedAt).toBeDefined();
  });

  it("should return timestamps", async () => {
    // Arrange
    const testZone = await createTestZone({
      title: "42-5-2",
      bar: 420502,
      sector: 0,
    });

    mockRequest = {
      params: { title: "42-5-2" },
    };

    // Act
    await getZoneByTitle(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(true);
    expect(responseJson.message).toBe("Zone retrieved successfully");
    expect(responseJson.data.createdAt).toBeDefined();
    expect(responseJson.data.updatedAt).toBeDefined();
    expect(new Date(responseJson.data.createdAt)).toBeInstanceOf(Date);
    expect(new Date(responseJson.data.updatedAt)).toBeInstanceOf(Date);
  });

  it("should handle exact title matching", async () => {
    // Arrange
    const testZone = await createTestZone({
      title: "42-5-3",
      bar: 420503,
      sector: 1,
    });

    mockRequest = {
      params: { title: "42-5-3" }, // exact match
    };

    // Act
    await getZoneByTitle(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(true);
    expect(responseJson.message).toBe("Zone retrieved successfully");
    expect(responseJson.data.title).toBe("42-5-3");

    // Test with different title (should not match)
    mockRequest = {
      params: { title: "42-5-4" }, // different title
    };

    await getZoneByTitle(mockRequest as Request, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Zone not found");
  });

  it("should handle special characters in title", async () => {
    // Arrange
    const testZone = await createTestZone({
      title: "42-5-4",
      bar: 420504,
      sector: 0,
    });

    mockRequest = {
      params: { title: "42-5-4!@#" }, // with special characters
    };

    // Act
    await getZoneByTitle(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(false);
    expect(responseJson.message).toBe("Zone not found");
    expect(responseJson.data).toBe(null);
  });
});
