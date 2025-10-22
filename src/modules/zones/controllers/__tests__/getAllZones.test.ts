import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestZone } from "../../../../test/setup.js";
import { getAllZones } from "../getAllZones.js";

// Импортируем тип из контроллера
interface GetAllZonesRequest extends Request<{}, {}, {}, any> {}

describe("getAllZones Controller", () => {
  let mockRequest: Partial<GetAllZonesRequest>;
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

  it("should return all zones with default pagination", async () => {
    // Arrange
    await createTestZone({ title: "42-1", bar: 4201, sector: 1 });
    await createTestZone({ title: "42-2", bar: 4202, sector: 2 });
    await createTestZone({ title: "42-3", bar: 4203, sector: 3 });

    mockRequest = {
      query: {},
    };

    // Act
    await getAllZones(mockRequest as GetAllZonesRequest, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Zones retrieved successfully");
    expect(responseJson.data).toHaveLength(3);
    expect(responseJson.pagination.page).toBe(1);
    expect(responseJson.pagination.limit).toBe(10);
    expect(responseJson.pagination.total).toBe(3);
    expect(responseJson.pagination.totalPages).toBe(1);
    expect(responseJson.pagination.hasNext).toBe(false);
    expect(responseJson.pagination.hasPrev).toBe(false);
  });

  it("should return zones with custom pagination", async () => {
    // Arrange
    await createTestZone({ title: "42-1", bar: 4201, sector: 1 });
    await createTestZone({ title: "42-2", bar: 4202, sector: 2 });
    await createTestZone({ title: "42-3", bar: 4203, sector: 3 });

    mockRequest = {
      query: {
        page: "2",
        limit: "2",
      },
    };

    // Act
    await getAllZones(mockRequest as GetAllZonesRequest, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(1); // Only 1 zone on page 2
    expect(responseJson.pagination.page).toBe(2);
    expect(responseJson.pagination.limit).toBe(2);
    expect(responseJson.pagination.total).toBe(3);
    expect(responseJson.pagination.totalPages).toBe(2);
    expect(responseJson.pagination.hasNext).toBe(false);
    expect(responseJson.pagination.hasPrev).toBe(true);
  });

  it("should search zones by title", async () => {
    // Arrange
    await createTestZone({ title: "42-1", bar: 4201, sector: 1 });
    await createTestZone({ title: "43-1", bar: 4301, sector: 2 });
    await createTestZone({ title: "44-1", bar: 4401, sector: 3 });

    mockRequest = {
      query: {
        search: "42",
      },
    };

    // Act
    await getAllZones(mockRequest as GetAllZonesRequest, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(1);
    expect(responseJson.data[0].title).toBe("42-1");
  });

  it("should search zones by title containing numbers", async () => {
    // Arrange
    await createTestZone({ title: "42-1", bar: 4201, sector: 1 });
    await createTestZone({ title: "43-1", bar: 4301, sector: 2 });
    await createTestZone({ title: "44-1", bar: 4401, sector: 3 });

    mockRequest = {
      query: {
        search: "43",
      },
    };

    // Act
    await getAllZones(mockRequest as GetAllZonesRequest, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(1);
    expect(responseJson.data[0].title).toBe("43-1");
  });

  it("should search zones by partial title match", async () => {
    // Arrange
    await createTestZone({ title: "42-1", bar: 4201, sector: 1 });
    await createTestZone({ title: "43-2", bar: 4301, sector: 2 });
    await createTestZone({ title: "44-1", bar: 4401, sector: 3 });

    mockRequest = {
      query: {
        search: "-2",
      },
    };

    // Act
    await getAllZones(mockRequest as GetAllZonesRequest, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(1);
    expect(responseJson.data[0].title).toBe("43-2");
  });

  it("should sort zones by sector ascending", async () => {
    // Arrange
    await createTestZone({ title: "42-3", bar: 4203, sector: 3 });
    await createTestZone({ title: "42-1", bar: 4201, sector: 1 });
    await createTestZone({ title: "42-2", bar: 4202, sector: 2 });

    mockRequest = {
      query: {
        sortBy: "sector",
        sortOrder: "asc",
      },
    };

    // Act
    await getAllZones(mockRequest as GetAllZonesRequest, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data[0].sector).toBe(1);
    expect(responseJson.data[1].sector).toBe(2);
    expect(responseJson.data[2].sector).toBe(3);
  });

  it("should sort zones by sector descending", async () => {
    // Arrange
    await createTestZone({ title: "42-1", bar: 4201, sector: 1 });
    await createTestZone({ title: "42-2", bar: 4202, sector: 2 });
    await createTestZone({ title: "42-3", bar: 4203, sector: 3 });

    mockRequest = {
      query: {
        sortBy: "sector",
        sortOrder: "desc",
      },
    };

    // Act
    await getAllZones(mockRequest as GetAllZonesRequest, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data[0].sector).toBe(3);
    expect(responseJson.data[1].sector).toBe(2);
    expect(responseJson.data[2].sector).toBe(1);
  });

  it("should sort zones by title", async () => {
    // Arrange
    await createTestZone({ title: "42-3", bar: 4203, sector: 1 });
    await createTestZone({ title: "42-1", bar: 4201, sector: 2 });
    await createTestZone({ title: "42-2", bar: 4202, sector: 3 });

    mockRequest = {
      query: {
        sortBy: "title",
        sortOrder: "asc",
      },
    };

    // Act
    await getAllZones(mockRequest as GetAllZonesRequest, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data[0].title).toBe("42-1");
    expect(responseJson.data[1].title).toBe("42-2");
    expect(responseJson.data[2].title).toBe("42-3");
  });

  it("should return 400 for invalid page parameter", async () => {
    // Arrange
    mockRequest = {
      query: {
        page: "0", // invalid page
      },
    };

    // Act
    await getAllZones(mockRequest as GetAllZonesRequest, res);

    // Assert
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Invalid query parameters");
    expect(responseJson.errors).toBeDefined();
  });

  it("should return 400 for invalid limit parameter", async () => {
    // Arrange
    mockRequest = {
      query: {
        limit: "101", // too high
      },
    };

    // Act
    await getAllZones(mockRequest as GetAllZonesRequest, res);

    // Assert
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Invalid query parameters");
    expect(responseJson.errors).toBeDefined();
  });

  it("should return 400 for invalid sortBy parameter", async () => {
    // Arrange
    mockRequest = {
      query: {
        sortBy: "invalidField",
      },
    };

    // Act
    await getAllZones(mockRequest as GetAllZonesRequest, res);

    // Assert
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Invalid query parameters");
    expect(responseJson.errors).toBeDefined();
  });

  it("should return 400 for invalid sortOrder parameter", async () => {
    // Arrange
    mockRequest = {
      query: {
        sortOrder: "invalid",
      },
    };

    // Act
    await getAllZones(mockRequest as GetAllZonesRequest, res);

    // Assert
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Invalid query parameters");
    expect(responseJson.errors).toBeDefined();
  });

  it("should return empty array when no zones exist", async () => {
    // Arrange
    mockRequest = {
      query: {},
    };

    // Act
    await getAllZones(mockRequest as GetAllZonesRequest, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(0);
    expect(responseJson.pagination.total).toBe(0);
  });

  it("should handle case-insensitive search", async () => {
    // Arrange
    await createTestZone({ title: "42-1", bar: 4201, sector: 1 });
    await createTestZone({ title: "43-1", bar: 4301, sector: 2 });

    mockRequest = {
      query: {
        search: "42", // lowercase search
      },
    };

    // Act
    await getAllZones(mockRequest as GetAllZonesRequest, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(1);
    expect(responseJson.data[0].title).toBe("42-1");
  });
});
