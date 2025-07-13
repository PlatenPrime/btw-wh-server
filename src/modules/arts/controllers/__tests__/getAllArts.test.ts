import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestArt } from "../../../../test/setup.js";
import { getAllArts } from "../getAllArts.js";

describe("getAllArts Controller", () => {
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

  it("should return all arts with default pagination", async () => {
    // Arrange
    const art1 = await createTestArt({
      artikul: "ART001",
      nameukr: "Test Art 1",
      namerus: "Тест Арт 1",
      zone: "A1",
    });

    const art2 = await createTestArt({
      artikul: "ART002",
      nameukr: "Test Art 2",
      namerus: "Тест Арт 2",
      zone: "A2",
    });

    mockRequest = {
      query: {},
    };

    // Act
    await getAllArts(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(2);
    expect(responseJson.total).toBe(2);
    expect(responseJson.page).toBe(1);
    expect(responseJson.totalPages).toBe(1);
    expect(responseJson.data[0].artikul).toBe("ART001");
    expect(responseJson.data[1].artikul).toBe("ART002");
  });

  it("should handle pagination correctly", async () => {
    // Arrange
    const arts = [];
    for (let i = 1; i <= 15; i++) {
      arts.push(
        await createTestArt({
          artikul: `ART${i.toString().padStart(3, "0")}`,
          nameukr: `Test Art ${i}`,
          zone: `A${i}`,
        })
      );
    }

    mockRequest = {
      query: { page: "2", limit: "5" },
    };

    // Act
    await getAllArts(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(5);
    expect(responseJson.total).toBe(15);
    expect(responseJson.page).toBe(2);
    expect(responseJson.totalPages).toBe(3);
    expect(responseJson.data[0].artikul).toBe("ART006");
  });

  it("should handle search by artikul", async () => {
    // Arrange
    await createTestArt({ artikul: "ABC123", nameukr: "Test Art", zone: "A1" });
    await createTestArt({
      artikul: "XYZ789",
      nameukr: "Another Art",
      zone: "A2",
    });

    mockRequest = {
      query: { search: "ABC" },
    };

    // Act
    await getAllArts(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(1);
    expect(responseJson.data[0].artikul).toBe("ABC123");
  });

  it("should handle search by nameukr", async () => {
    // Arrange
    await createTestArt({
      artikul: "ART001",
      nameukr: "Українська назва",
      zone: "A1",
    });
    await createTestArt({
      artikul: "ART002",
      nameukr: "English name",
      zone: "A2",
    });

    mockRequest = {
      query: { search: "українська" },
    };

    // Act
    await getAllArts(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(1);
    expect(responseJson.data[0].nameukr).toBe("Українська назва");
  });

  it("should handle search by namerus", async () => {
    // Arrange
    await createTestArt({
      artikul: "ART001",
      namerus: "Русское название",
      zone: "A1",
    });
    await createTestArt({
      artikul: "ART002",
      namerus: "Another name",
      zone: "A2",
    });

    mockRequest = {
      query: { search: "русское" },
    };

    // Act
    await getAllArts(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(1);
    expect(responseJson.data[0].namerus).toBe("Русское название");
  });

  it("should handle case-insensitive search", async () => {
    // Arrange
    await createTestArt({ artikul: "ART001", nameukr: "Test Art", zone: "A1" });

    mockRequest = {
      query: { search: "test art" },
    };

    // Act
    await getAllArts(mockRequest as Request, mockResponse as Response);

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
    await getAllArts(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(0);
    expect(responseJson.total).toBe(0);
    expect(responseJson.page).toBe(1);
    expect(responseJson.totalPages).toBe(0);
  });

  it("should handle invalid page parameter", async () => {
    // Arrange
    await createTestArt({ artikul: "ART001", nameukr: "Test Art", zone: "A1" });

    mockRequest = {
      query: { page: "invalid" },
    };

    // Act
    await getAllArts(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(1);
    expect(responseJson.page).toBe(1); // Should default to 1
  });

  it("should handle invalid limit parameter", async () => {
    // Arrange
    await createTestArt({ artikul: "ART001", nameukr: "Test Art", zone: "A1" });

    mockRequest = {
      query: { limit: "invalid" },
    };

    // Act
    await getAllArts(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(1);
    expect(responseJson.totalPages).toBe(1); // Should use default limit of 10
  });

  it("should sort arts by artikul in ascending order", async () => {
    // Arrange
    await createTestArt({ artikul: "ZART003", nameukr: "Z Art", zone: "A3" });
    await createTestArt({ artikul: "AART001", nameukr: "A Art", zone: "A1" });
    await createTestArt({ artikul: "BART002", nameukr: "B Art", zone: "A2" });

    mockRequest = {
      query: {},
    };

    // Act
    await getAllArts(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(3);
    expect(responseJson.data[0].artikul).toBe("AART001");
    expect(responseJson.data[1].artikul).toBe("BART002");
    expect(responseJson.data[2].artikul).toBe("ZART003");
  });
});
