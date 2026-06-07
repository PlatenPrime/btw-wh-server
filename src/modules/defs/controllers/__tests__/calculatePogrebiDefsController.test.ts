import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { calculatePogrebiDefsController } from "../calculate-pogrebi-defs/calculatePogrebiDefsController.js";

vi.mock("../../utils/calculationStatus.js", () => ({
  getCalculationStatus: vi.fn(),
}));

vi.mock("../calculate-pogrebi-defs/utils/calculateAndSavePogrebiDefsUtil.js", () => ({
  calculateAndSavePogrebiDefsUtil: vi.fn(),
}));

import { calculateAndSavePogrebiDefsUtil } from "../calculate-pogrebi-defs/utils/calculateAndSavePogrebiDefsUtil.js";
import { getCalculationStatus } from "../../utils/calculationStatus.js";

const mockedCalculateAndSavePogrebiDefsUtil = vi.mocked(
  calculateAndSavePogrebiDefsUtil
);
const mockedGetCalculationStatus = vi.mocked(getCalculationStatus);

const idleStatus = {
  isRunning: false,
  progress: 0,
  estimatedTimeRemaining: 0,
  startedAt: null,
  lastUpdate: null,
  currentStep: undefined,
  totalItems: undefined,
  processedItems: undefined,
};

describe("calculatePogrebiDefsController", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockJson = vi.fn().mockReturnThis();
    mockStatus = vi.fn().mockReturnThis();

    mockReq = {};
    mockRes = {
      json: mockJson,
      status: mockStatus,
    };

    vi.clearAllMocks();
    mockedGetCalculationStatus.mockReturnValue(idleStatus);
  });

  it("409 when calculation is already running", async () => {
    mockedGetCalculationStatus.mockReturnValue({
      ...idleStatus,
      isRunning: true,
      progress: 50,
    });

    await calculatePogrebiDefsController(
      mockReq as Request,
      mockRes as Response
    );

    expect(mockedCalculateAndSavePogrebiDefsUtil).not.toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(409);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      message: "Розрахунок вже виконується",
      error: "Calculation is already in progress",
    });
  });

  it("201 on successful calculation", async () => {
    const mockSavedDef = {
      _id: "test-id",
      result: {
        ART001: {
          nameukr: "Товар 1",
          quant: 10,
          sharikQuant: 5,
          difQuant: -5,
          defLimit: 30,
          status: "critical" as const,
        },
      },
      createdAt: new Date("2024-01-15T10:00:00.000Z"),
      total: 1,
      totalCriticalDefs: 1,
      totalLimitDefs: 0,
    };

    mockedCalculateAndSavePogrebiDefsUtil.mockResolvedValue(mockSavedDef as never);

    await calculatePogrebiDefsController(
      mockReq as Request,
      mockRes as Response
    );

    expect(mockedGetCalculationStatus).toHaveBeenCalledTimes(1);
    expect(mockedCalculateAndSavePogrebiDefsUtil).toHaveBeenCalledTimes(1);
    expect(mockStatus).toHaveBeenCalledWith(201);
    expect(mockJson).toHaveBeenCalledWith({
      success: true,
      message: "Deficit calculation completed and saved successfully",
      data: {
        total: 1,
        totalCriticalDefs: 1,
        totalLimitDefs: 0,
        createdAt: new Date("2024-01-15T10:00:00.000Z"),
      },
    });
  });

  it("500 when calculation throws", async () => {
    const error = new Error("Calculation failed");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockedCalculateAndSavePogrebiDefsUtil.mockRejectedValue(error);

    await calculatePogrebiDefsController(
      mockReq as Request,
      mockRes as Response
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error in calculatePogrebiDefsController:",
      error
    );
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      message: "Failed to calculate and save deficits",
      error: "Calculation failed",
    });

    consoleSpy.mockRestore();
  });

  it("500 with Unknown error for non-Error rejection", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockedCalculateAndSavePogrebiDefsUtil.mockRejectedValue("String error");

    await calculatePogrebiDefsController(
      mockReq as Request,
      mockRes as Response
    );

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      message: "Failed to calculate and save deficits",
      error: "Unknown error",
    });

    consoleSpy.mockRestore();
  });

  it("returns aggregated totals on success", async () => {
    const mockSavedDef = {
      _id: "test-id",
      result: {
        ART001: {
          nameukr: "Товар 1",
          quant: 10,
          sharikQuant: 5,
          difQuant: -5,
          defLimit: 30,
          status: "critical" as const,
        },
        ART002: {
          nameukr: "Товар 2",
          quant: 5,
          sharikQuant: 25,
          difQuant: 20,
          defLimit: 25,
          status: "limited" as const,
        },
      },
      createdAt: new Date("2024-01-15T10:00:00.000Z"),
      total: 2,
      totalCriticalDefs: 1,
      totalLimitDefs: 1,
    };

    mockedCalculateAndSavePogrebiDefsUtil.mockResolvedValue(mockSavedDef as never);

    await calculatePogrebiDefsController(
      mockReq as Request,
      mockRes as Response
    );

    expect(mockJson).toHaveBeenCalledWith({
      success: true,
      message: "Deficit calculation completed and saved successfully",
      data: {
        total: 2,
        totalCriticalDefs: 1,
        totalLimitDefs: 1,
        createdAt: new Date("2024-01-15T10:00:00.000Z"),
      },
    });
  });

  it("handles empty result", async () => {
    const mockSavedDef = {
      _id: "test-id",
      result: {},
      createdAt: new Date("2024-01-15T10:00:00.000Z"),
      total: 0,
      totalCriticalDefs: 0,
      totalLimitDefs: 0,
    };

    mockedCalculateAndSavePogrebiDefsUtil.mockResolvedValue(mockSavedDef as never);

    await calculatePogrebiDefsController(
      mockReq as Request,
      mockRes as Response
    );

    expect(mockJson).toHaveBeenCalledWith({
      success: true,
      message: "Deficit calculation completed and saved successfully",
      data: {
        total: 0,
        totalCriticalDefs: 0,
        totalLimitDefs: 0,
        createdAt: new Date("2024-01-15T10:00:00.000Z"),
      },
    });
  });
});
