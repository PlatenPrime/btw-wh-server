import { beforeEach, describe, expect, it, vi } from "vitest";
import { calculatePogrebiDefsController } from "../calculatePogrebiDefs.js";
// Мокаем зависимости
vi.mock("../../../../utils/asyncHandler.js", () => ({
    asyncHandler: (fn) => fn,
}));
vi.mock("../../utils/calculatePogrebiDefs.js", () => ({
    calculateAndSavePogrebiDefs: vi.fn(),
}));
vi.mock("../../utils/calculationStatus.js", () => ({
    resetCalculationStatus: vi.fn(),
    finishCalculationTracking: vi.fn(),
}));
import { calculateAndSavePogrebiDefs } from "../../utils/calculatePogrebiDefs.js";
import { finishCalculationTracking, resetCalculationStatus, } from "../../utils/calculationStatus.js";
const mockedCalculateAndSavePogrebiDefs = vi.mocked(calculateAndSavePogrebiDefs);
const mockedResetCalculationStatus = vi.mocked(resetCalculationStatus);
const mockedFinishCalculationTracking = vi.mocked(finishCalculationTracking);
describe("calculatePogrebiDefsController", () => {
    let mockReq;
    let mockRes;
    let mockJson;
    let mockStatus;
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
        const mockSavedDefcalc = {
            _id: "test-id",
            result: {
                ART001: {
                    nameukr: "Товар 1",
                    quant: 10,
                    boxes: 2,
                    sharikQuant: 5,
                    difQuant: -5,
                    limit: 20,
                },
            },
            createdAt: new Date("2024-01-15T10:00:00.000Z"),
            totalItems: 1,
            totalDeficits: 1,
        };
        mockedCalculateAndSavePogrebiDefs.mockResolvedValue(mockSavedDefcalc);
        await calculatePogrebiDefsController(mockReq, mockRes, vi.fn());
        // Проверяем последовательность вызовов
        expect(mockedResetCalculationStatus).toHaveBeenCalledTimes(1);
        expect(mockedCalculateAndSavePogrebiDefs).toHaveBeenCalledTimes(1);
        expect(mockedFinishCalculationTracking).toHaveBeenCalledTimes(1);
        // Проверяем ответ
        expect(mockStatus).toHaveBeenCalledWith(201);
        expect(mockJson).toHaveBeenCalledWith({
            success: true,
            message: "Deficit calculation completed and saved successfully",
            data: {
                totalItems: 1,
                totalDeficits: 1,
                createdAt: new Date("2024-01-15T10:00:00.000Z"),
            },
        });
    });
    it("должен обрабатывать ошибки и завершать отслеживание", async () => {
        const error = new Error("Calculation failed");
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });
        mockedCalculateAndSavePogrebiDefs.mockRejectedValue(error);
        await calculatePogrebiDefsController(mockReq, mockRes, vi.fn());
        // Проверяем, что отслеживание было сброшено и завершено
        expect(mockedResetCalculationStatus).toHaveBeenCalledTimes(1);
        expect(mockedFinishCalculationTracking).toHaveBeenCalledTimes(1);
        // Проверяем обработку ошибки
        expect(consoleSpy).toHaveBeenCalledWith("Error in calculatePogrebiDefsController:", error);
        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({
            success: false,
            message: "Failed to calculate and save deficits",
            error: "Calculation failed",
        });
        consoleSpy.mockRestore();
    });
    it("должен обрабатывать ошибки без message", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });
        mockedCalculateAndSavePogrebiDefs.mockRejectedValue("String error");
        await calculatePogrebiDefsController(mockReq, mockRes, vi.fn());
        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({
            success: false,
            message: "Failed to calculate and save deficits",
            error: "Unknown error",
        });
        consoleSpy.mockRestore();
    });
    it("должен завершать отслеживание даже при ошибке", async () => {
        const error = new Error("Network error");
        mockedCalculateAndSavePogrebiDefs.mockRejectedValue(error);
        await calculatePogrebiDefsController(mockReq, mockRes, vi.fn());
        // Проверяем, что finishCalculationTracking вызывается даже при ошибке
        expect(mockedFinishCalculationTracking).toHaveBeenCalledTimes(1);
        expect(mockedResetCalculationStatus).toHaveBeenCalledTimes(1);
    });
    it("должен возвращать правильную структуру данных при успехе", async () => {
        const mockSavedDefcalc = {
            _id: "test-id",
            result: {
                ART001: {
                    nameukr: "Товар 1",
                    quant: 10,
                    boxes: 2,
                    sharikQuant: 5,
                    difQuant: -5,
                    limit: 20,
                },
                ART002: {
                    nameukr: "Товар 2",
                    quant: 5,
                    boxes: 1,
                    sharikQuant: 10,
                    difQuant: 5,
                    limit: 5,
                },
            },
            createdAt: new Date("2024-01-15T10:00:00.000Z"),
            totalItems: 2,
            totalDeficits: 1,
        };
        mockedCalculateAndSavePogrebiDefs.mockResolvedValue(mockSavedDefcalc);
        await calculatePogrebiDefsController(mockReq, mockRes, vi.fn());
        expect(mockJson).toHaveBeenCalledWith({
            success: true,
            message: "Deficit calculation completed and saved successfully",
            data: {
                totalItems: 2,
                totalDeficits: 1,
                createdAt: new Date("2024-01-15T10:00:00.000Z"),
            },
        });
    });
    it("должен корректно обрабатывать пустой результат", async () => {
        const mockSavedDefcalc = {
            _id: "test-id",
            result: {},
            createdAt: new Date("2024-01-15T10:00:00.000Z"),
            totalItems: 0,
            totalDeficits: 0,
        };
        mockedCalculateAndSavePogrebiDefs.mockResolvedValue(mockSavedDefcalc);
        await calculatePogrebiDefsController(mockReq, mockRes, vi.fn());
        expect(mockJson).toHaveBeenCalledWith({
            success: true,
            message: "Deficit calculation completed and saved successfully",
            data: {
                totalItems: 0,
                totalDeficits: 0,
                createdAt: new Date("2024-01-15T10:00:00.000Z"),
            },
        });
    });
});
