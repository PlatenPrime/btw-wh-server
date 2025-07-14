import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestArt } from "../../../../test/setup.js";
import { getAllArts } from "../getAllArts.js";

describe("getAllArts Controller", () => {
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

  it("should return all arts with default pagination", async () => {
    // Arrange
    const art1 = await createTestArt({
      artikul: "5555-0000",
      nameukr: "Test Art 1",
      namerus: "Тест Арт 1",
      zone: "A1",
    });

    const art2 = await createTestArt({
      artikul: "5555-0001",
      nameukr: "Test Art 2",
      namerus: "Тест Арт 2",
      zone: "A2",
    });

    mockRequest = {
      query: {},
    };

    // Act
    await getAllArts(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(2);
    expect(responseJson.total).toBe(2);
    expect(responseJson.page).toBe(1);
    expect(responseJson.totalPages).toBe(1);
    expect(responseJson.data[0].artikul).toBe("5555-0000");
    expect(responseJson.data[1].artikul).toBe("5555-0001");
  });

  it("should handle pagination correctly", async () => {
    // Arrange
    const arts = [];
    for (let i = 1; i <= 15; i++) {
      arts.push(
        await createTestArt({
          artikul: `5555-00${i < 10 ?  ("0" + i) : i }`,
          nameukr: `Test Art ${i}`,
          zone: `99-99-${i}`,
        })
      );
    }

    mockRequest = {
      query: { page: "2", limit: "5" },
    };

    // Act
    await getAllArts(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(5);
    expect(responseJson.total).toBe(15);
    expect(responseJson.page).toBe(2);
    expect(responseJson.totalPages).toBe(3);
    expect(responseJson.data[0].artikul).toBe("5555-0006");
  });

  it("should handle search by artikul", async () => {
    // Arrange
    await createTestArt({ artikul: "5555-0006", nameukr: "Test Art", zone: "A1" });
    await createTestArt({
      artikul: "XYZ789",
      nameukr: "Another Art",
      zone: "A2",
    });

    mockRequest = {
      query: { search: "5555" },
    };

    // Act
    await getAllArts(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(1);
    expect(responseJson.data[0].artikul).toBe("5555-0006");
  });

  it("should handle search by nameukr", async () => {
    // Arrange
    await createTestArt({
      artikul: "5555-0001",
      nameukr: "Українська назва",
      zone: "A1",
    });
    await createTestArt({
      artikul: "5555-0002",
      nameukr: "English name",
      zone: "A2",
    });

    mockRequest = {
      query: { search: "українська" },
    };

    // Act
    await getAllArts(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(1);
    expect(responseJson.data[0].nameukr).toBe("Українська назва");
  });

  it("should handle search by namerus", async () => {
    // Arrange
    await createTestArt({
      artikul: "5555-0001",
      namerus: "Русское название",
      zone: "A1",
    });
    await createTestArt({
      artikul: "5555-0002",
      namerus: "Another name",
      zone: "A2",
    });

    mockRequest = {
      query: { search: "русское" },
    };

    // Act
    await getAllArts(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(1);
    expect(responseJson.data[0].namerus).toBe("Русское название");
  });

  it("should handle case-insensitive search", async () => {
    // Arrange
    await createTestArt({ artikul: "5555-0001", nameukr: "Test Art", zone: "A1" });

    mockRequest = {
      query: { search: "test art" },
    };

    // Act
    await getAllArts(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(1);
    expect(responseJson.data[0].nameukr).toBe("Test Art");
  });

  it("should return empty array when no arts found", async () => {
    // Arrange
    mockRequest = {
      query: {},
    };

    // Act
    await getAllArts(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(0);
    expect(responseJson.total).toBe(0);
    expect(responseJson.page).toBe(1);
    expect(responseJson.totalPages).toBe(0);
  });

  it("should handle invalid page parameter", async () => {
    // Arrange
    await createTestArt({ artikul: "5555-0001", nameukr: "Test Art", zone: "A1" });

    mockRequest = {
      query: { page: "invalid" },
    };

    // Act
    await getAllArts(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(1);
    expect(responseJson.page).toBe(1); // Should default to 1
  });

  it("should handle invalid limit parameter", async () => {
    // Arrange
    await createTestArt({ artikul: "5555-0001", nameukr: "Test Art", zone: "A1" });

    mockRequest = {
      query: { limit: "invalid" },
    };

    // Act
    await getAllArts(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(1);
    expect(responseJson.totalPages).toBe(1); // Should use default limit of 10
  });

  it("should sort arts by artikul in ascending order", async () => {
    // Arrange
    await createTestArt({ artikul: "Z5555-0003", nameukr: "Z Art", zone: "A3" });
    await createTestArt({ artikul: "A5555-0001", nameukr: "A Art", zone: "A1" });
    await createTestArt({ artikul: "B5555-0002", nameukr: "B Art", zone: "A2" });

    mockRequest = {
      query: {},
    };

    // Act
    await getAllArts(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(3);
    expect(responseJson.data[0].artikul).toBe("A5555-0001");
    expect(responseJson.data[1].artikul).toBe("B5555-0002");
    expect(responseJson.data[2].artikul).toBe("Z5555-0003");
  });
});
