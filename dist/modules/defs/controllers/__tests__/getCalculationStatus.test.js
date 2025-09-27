import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCalculationStatus, resetCalculationStatus, } from "../../utils/calculationStatus.js";
import { getCalculationStatusController } from "../getCalculationStatus.js";
// Мокаем asyncHandler
vi.mock("../../../../utils/asyncHandler.js", () => ({
    asyncHandler: (fn) => fn,
}));
// Мокаем calculationStatus
vi.mock("../../utils/calculationStatus.js", () => ({
    getCalculationStatus: vi.fn(),
    resetCalculationStatus: vi.fn(),
    updateCalculationStatus: vi.fn(),
}));
describe("getCalculationStatusController", () => {
    let mockReq;
    let mockRes;
    let mockNext;
    let mockJson;
    let mockStatus;
    beforeEach(() => {
        mockJson = vi.fn();
        mockStatus = vi.fn().mockReturnThis();
        mockNext = vi.fn();
        mockReq = {};
        mockRes = {
            json: mockJson,
            status: mockStatus,
        };
        // Сбрасываем состояние перед каждым тестом
        resetCalculationStatus();
        vi.clearAllMocks();
        // Настраиваем моки по умолчанию
        vi.mocked(getCalculationStatus).mockReturnValue({
            isRunning: false,
            progress: 0,
            estimatedTimeRemaining: 0,
            startedAt: null,
            lastUpdate: null,
            currentStep: undefined,
            totalItems: undefined,
            processedItems: undefined,
        });
    });
    it("должен возвращать статус когда расчет не запущен", async () => {
        await getCalculationStatusController(mockReq, mockRes, mockNext);
        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith({
            success: true,
            data: {
                isRunning: false,
                progress: 0,
                estimatedTimeRemaining: 0,
                startedAt: null,
                lastUpdate: null,
                currentStep: undefined,
                totalItems: undefined,
                processedItems: undefined,
            },
        });
    });
    it("должен возвращать статус когда расчет запущен", async () => {
        // Настраиваем мок для запущенного расчета
        vi.mocked(getCalculationStatus).mockReturnValue({
            isRunning: true,
            progress: 45,
            estimatedTimeRemaining: 180,
            startedAt: "2024-01-15T10:30:00.000Z",
            lastUpdate: "2024-01-15T10:32:00.000Z",
            currentStep: "Обработка данных Sharik",
            totalItems: 100,
            processedItems: 45,
        });
        await getCalculationStatusController(mockReq, mockRes, mockNext);
        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith({
            success: true,
            data: {
                isRunning: true,
                progress: 45,
                estimatedTimeRemaining: 180,
                startedAt: "2024-01-15T10:30:00.000Z",
                lastUpdate: "2024-01-15T10:32:00.000Z",
                currentStep: "Обработка данных Sharik",
                totalItems: 100,
                processedItems: 45,
            },
        });
    });
    it("должен возвращать статус когда расчет завершен", async () => {
        // Настраиваем мок для завершенного расчета
        vi.mocked(getCalculationStatus).mockReturnValue({
            isRunning: false,
            progress: 100,
            estimatedTimeRemaining: 0,
            startedAt: "2024-01-15T10:30:00.000Z",
            lastUpdate: "2024-01-15T10:35:00.000Z",
            currentStep: "Расчет завершен",
            totalItems: 100,
            processedItems: 100,
        });
        await getCalculationStatusController(mockReq, mockRes, mockNext);
        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith({
            success: true,
            data: {
                isRunning: false,
                progress: 100,
                estimatedTimeRemaining: 0,
                startedAt: "2024-01-15T10:30:00.000Z",
                lastUpdate: "2024-01-15T10:35:00.000Z",
                currentStep: "Расчет завершен",
                totalItems: 100,
                processedItems: 100,
            },
        });
    });
    it("должен обрабатывать ошибки и возвращать 500", async () => {
        // Мокаем getCalculationStatus чтобы он выбрасывал ошибку
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });
        // Создаем ошибку
        vi.mocked(getCalculationStatus).mockImplementation(() => {
            throw new Error("Test error");
        });
        await getCalculationStatusController(mockReq, mockRes, mockNext);
        expect(consoleSpy).toHaveBeenCalledWith("Error in getCalculationStatusController:", expect.any(Error));
        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({
            success: false,
            message: "Failed to get calculation status",
            error: "Test error",
        });
        consoleSpy.mockRestore();
    });
    it("должен обрабатывать ошибки без сообщения", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });
        // Создаем ошибку без message
        vi.mocked(getCalculationStatus).mockImplementation(() => {
            throw "String error";
        });
        await getCalculationStatusController(mockReq, mockRes, mockNext);
        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({
            success: false,
            message: "Failed to get calculation status",
            error: "Unknown error",
        });
        consoleSpy.mockRestore();
    });
    it("должен возвращать актуальный статус при каждом вызове", async () => {
        // Первый вызов - статус не запущен
        await getCalculationStatusController(mockReq, mockRes, mockNext);
        expect(mockJson).toHaveBeenCalledWith({
            success: true,
            data: expect.objectContaining({
                isRunning: false,
                progress: 0,
            }),
        });
        // Настраиваем мок для обновленного статуса
        vi.mocked(getCalculationStatus).mockReturnValue({
            isRunning: true,
            progress: 50,
            estimatedTimeRemaining: 100,
            startedAt: "2024-01-15T10:30:00.000Z",
            lastUpdate: "2024-01-15T10:32:00.000Z",
            currentStep: "Processing",
            totalItems: 100,
            processedItems: 50,
        });
        // Второй вызов - статус обновлен
        await getCalculationStatusController(mockReq, mockRes, mockNext);
        expect(mockJson).toHaveBeenCalledWith({
            success: true,
            data: expect.objectContaining({
                isRunning: true,
                progress: 50,
                currentStep: "Processing",
            }),
        });
    });
});
