import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestZone } from "../../../../test/setup.js";
import { bulkCreateZones } from "../bulkCreateZones.js";

describe("bulkCreateZones Controller", () => {
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

  it("should create multiple zones successfully", async () => {
    // Arrange
    mockRequest = {
      body: {
        zones: [
          { title: "42-1", bar: 4201 },
          { title: "42-2", bar: 4202 },
          { title: "42-3", bar: 4203 },
        ],
      },
    };

    // Act
    await bulkCreateZones(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Bulk create completed");
    expect(responseJson.results.created).toBe(3);
    expect(responseJson.results.skipped).toBe(0);
    expect(responseJson.results.errors).toHaveLength(0);
  });

  it("should skip zones with duplicate titles", async () => {
    // Arrange
    await createTestZone({ title: "42-1", bar: 4201, sector: 0 });

    mockRequest = {
      body: {
        zones: [
          { title: "42-1", bar: 9999 }, // duplicate title
          { title: "42-2", bar: 4202 }, // new zone
        ],
      },
    };

    // Act
    await bulkCreateZones(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.results.created).toBe(1);
    expect(responseJson.results.skipped).toBe(1);
    expect(responseJson.results.errors).toHaveLength(1);
    expect(responseJson.results.errors[0].error).toContain("already exists");
  });

  it("should skip zones with duplicate bars", async () => {
    // Arrange
    await createTestZone({ title: "42-1", bar: 4201, sector: 0 });

    mockRequest = {
      body: {
        zones: [
          { title: "99-9", bar: 4201 }, // duplicate bar
          { title: "42-2", bar: 4202 }, // new zone
        ],
      },
    };

    // Act
    await bulkCreateZones(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.results.created).toBe(1);
    expect(responseJson.results.skipped).toBe(1);
    expect(responseJson.results.errors).toHaveLength(1);
    expect(responseJson.results.errors[0].error).toContain("already exists");
  });

  it("should return 400 for empty zones array", async () => {
    // Arrange
    mockRequest = {
      body: {
        zones: [],
      },
    };

    // Act
    await bulkCreateZones(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
    expect(responseJson.errors).toBeDefined();
  });

  it("should return 400 for missing zones field", async () => {
    // Arrange
    mockRequest = {
      body: {},
    };

    // Act
    await bulkCreateZones(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
    expect(responseJson.errors).toBeDefined();
  });

  it("should return 400 for too many zones", async () => {
    // Arrange
    const zones = Array.from({ length: 1001 }, (_, i) => ({
      title: `42-${i}`,
      bar: 4200 + i,
    }));

    mockRequest = {
      body: { zones },
    };

    // Act
    await bulkCreateZones(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
    expect(responseJson.errors).toBeDefined();
  });

  it("should return 400 for invalid zone data", async () => {
    // Arrange
    mockRequest = {
      body: {
        zones: [
          { title: "invalid-title", bar: 4201 }, // invalid title
          { title: "42-2", bar: -1 }, // invalid bar
        ],
      },
    };

    // Act
    await bulkCreateZones(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
    expect(responseJson.errors).toBeDefined();
  });

  it("should handle mixed success and failure", async () => {
    // Arrange
    await createTestZone({ title: "42-1", bar: 4201, sector: 0 });

    mockRequest = {
      body: {
        zones: [
          { title: "42-1", bar: 9999 }, // duplicate title - should skip
          { title: "42-2", bar: 4202 }, // valid - should create
          { title: "42-3", bar: 4203 }, // valid - should create
        ],
      },
    };

    // Act
    await bulkCreateZones(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.results.created).toBe(2);
    expect(responseJson.results.skipped).toBe(1);
    expect(responseJson.results.errors).toHaveLength(1);
  });

  it("should set sector to 0 for all created zones", async () => {
    // Arrange
    mockRequest = {
      body: {
        zones: [
          { title: "42-1", bar: 4201 },
          { title: "42-2", bar: 4202 },
        ],
      },
    };

    // Act
    await bulkCreateZones(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.results.created).toBe(2);

    // Verify zones were created with sector = 0
    const Zone = require("mongoose").model("Zone");
    const createdZones = await Zone.find({ title: { $in: ["42-1", "42-2"] } });
    expect(createdZones).toHaveLength(2);
    createdZones.forEach((zone: any) => {
      expect(zone.sector).toBe(0);
    });
  });

  it("should handle zones with different title formats", async () => {
    // Arrange
    mockRequest = {
      body: {
        zones: [
          { title: "42-1", bar: 4201 },
          { title: "22-5-1", bar: 22501 },
          { title: "42-13-2", bar: 421302 },
          { title: "1", bar: 1 },
        ],
      },
    };

    // Act
    await bulkCreateZones(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.results.created).toBe(4);
    expect(responseJson.results.skipped).toBe(0);
    expect(responseJson.results.errors).toHaveLength(0);
  });

  it("should provide detailed error information", async () => {
    // Arrange
    await createTestZone({ title: "42-1", bar: 4201, sector: 0 });

    mockRequest = {
      body: {
        zones: [
          { title: "42-1", bar: 9999 }, // duplicate title
          { title: "42-2", bar: 4202 }, // valid
        ],
      },
    };

    // Act
    await bulkCreateZones(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.results.errors).toHaveLength(1);
    expect(responseJson.results.errors[0].index).toBe(0);
    expect(responseJson.results.errors[0].error).toContain("already exists");
    expect(responseJson.results.errors[0].data).toEqual({
      title: "42-1",
      bar: 9999,
    });
  });

  it("should handle single zone creation", async () => {
    // Arrange
    mockRequest = {
      body: {
        zones: [{ title: "42-1", bar: 4201 }],
      },
    };

    // Act
    await bulkCreateZones(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.results.created).toBe(1);
    expect(responseJson.results.skipped).toBe(0);
    expect(responseJson.results.errors).toHaveLength(0);
  });

  it("should handle maximum allowed zones", async () => {
    // Arrange
    const zones = Array.from({ length: 100 }, (_, i) => ({
      title: `42-${i}`,
      bar: 4200 + i,
    }));

    mockRequest = {
      body: { zones },
    };

    // Act
    await bulkCreateZones(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.results.created).toBe(100);
    expect(responseJson.results.skipped).toBe(0);
    expect(responseJson.results.errors).toHaveLength(0);
  });
});
