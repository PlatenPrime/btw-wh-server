import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { calculatePogrebiDefsController } from "../calculate-pogrebi-defs/calculatePogrebiDefsController.js";

vi.mock("../../utils/calculationStatus.js", () => ({
  resetCalculationStatus: vi.fn(),
}));

vi.mock("../calculate-pogrebi-defs/utils/calculateAndSavePogrebiDefsUtil.js", () => ({
  calculateAndSavePogrebiDefsUtil: vi.fn(),
}));

import { calculateAndSavePogrebiDefsUtil } from "../calculate-pogrebi-defs/utils/calculateAndSavePogrebiDefsUtil.js";
import { resetCalculationStatus } from "../../utils/calculationStatus.js";

const mockedCalculateAndSavePogrebiDefsUtil = vi.mocked(calculateAndSavePogrebiDefsUtil);
const mockedResetCalculationStatus = vi.mocked(resetCalculationStatus);

describe("calculatePogrebiDefsController", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: any;
  let mockStatus: any;

  beforeEach(() => {
    mockJson = vi.fn().mockReturnThis();
    mockStatus = vi.fn().mockReturnThis();

    mockReq = {};
    mockRes = {
      json: mockJson,
      status: mockStatus,
    };

    vi.clearAllMocks();
  });

  it("должен успешно выполнять расчет и возвращать результат", async () => {
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

    mockedCalculateAndSavePogrebiDefsUtil.mockResolvedValue(mockSavedDef as any);

    await calculatePogrebiDefsController(
      mockReq as Request,
      mockRes as Response
    );

    // Проверяем последовательность вызовов
    expect(mockedResetCalculationStatus).toHaveBeenCalledTimes(1);
    expect(mockedCalculateAndSavePogrebiDefsUtil).toHaveBeenCalledTimes(1);

    // Проверяем ответ
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

  it("должен обрабатывать ошибки", async () => {
    const error = new Error("Calculation failed");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockedCalculateAndSavePogrebiDefsUtil.mockRejectedValue(error);

    await calculatePogrebiDefsController(
      mockReq as Request,
      mockRes as Response
    );

    // Проверяем, что отслеживание было сброшено
    expect(mockedResetCalculationStatus).toHaveBeenCalledTimes(1);

    // Проверяем обработку ошибки
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

  it("должен обрабатывать ошибки без message", async () => {
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

  it("должен возвращать правильную структуру данных при успехе", async () => {
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

    mockedCalculateAndSavePogrebiDefsUtil.mockResolvedValue(mockSavedDef as any);

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

  it("должен корректно обрабатывать пустой результат", async () => {
    const mockSavedDef = {
      _id: "test-id",
      result: {},
      createdAt: new Date("2024-01-15T10:00:00.000Z"),
      total: 0,
      totalCriticalDefs: 0,
      totalLimitDefs: 0,
    };

    mockedCalculateAndSavePogrebiDefsUtil.mockResolvedValue(mockSavedDef as any);

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
