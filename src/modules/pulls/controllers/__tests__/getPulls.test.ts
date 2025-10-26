// @ts-nocheck
import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPulls } from "../getPulls.js";

// Mock the calculatePulls utility
vi.mock("../../utils/calculatePulls.js", () => ({
  calculatePulls: vi.fn(),
}));

describe("getPulls Controller", () => {
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

  it("should return pulls successfully", async () => {
    // Arrange
    const mockPullsResponse = {
      pulls: [
        {
          palletId: new mongoose.Types.ObjectId(),
          palletTitle: "Test Pallet",
          sector: 1,
          rowTitle: "Test Row",
          positions: [],
          totalAsks: 1,
        },
      ],
      totalPulls: 1,
      totalAsks: 1,
    };

    const { calculatePulls } = await import("../../utils/calculatePulls.js");
    vi.mocked(calculatePulls).mockResolvedValue(mockPullsResponse);

    mockRequest = {};

    // Act
    await getPulls(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.success).toBe(true);
    expect(responseJson.message).toBe("Pulls calculated successfully");
    expect(responseJson.data).toEqual(mockPullsResponse);
  });

  it("should handle empty pulls response", async () => {
    // Arrange
    const mockEmptyResponse = {
      pulls: [],
      totalPulls: 0,
      totalAsks: 0,
    };

    const { calculatePulls } = await import("../../utils/calculatePulls.js");
    vi.mocked(calculatePulls).mockResolvedValue(mockEmptyResponse);

    mockRequest = {};

    // Act
    await getPulls(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.success).toBe(true);
    expect(responseJson.data.pulls).toHaveLength(0);
    expect(responseJson.data.totalPulls).toBe(0);
  });

  it("should handle calculation errors", async () => {
    // Arrange
    const { calculatePulls } = await import("../../utils/calculatePulls.js");
    vi.mocked(calculatePulls).mockRejectedValue(
      new Error("Database connection failed")
    );

    mockRequest = {};

    // Act
    await getPulls(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(500);
    expect(responseJson.success).toBe(false);
    expect(responseJson.message).toBe("Failed to calculate pulls");
    expect(responseJson.error).toBe("Database connection failed");
  });

  it("should handle unknown errors", async () => {
    // Arrange
    const { calculatePulls } = await import("../../utils/calculatePulls.js");
    vi.mocked(calculatePulls).mockRejectedValue("Unknown error");

    mockRequest = {};

    // Act
    await getPulls(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(500);
    expect(responseJson.success).toBe(false);
    expect(responseJson.message).toBe("Failed to calculate pulls");
    expect(responseJson.error).toBe("Unknown error");
  });
});
