import { beforeEach, describe, expect, it, vi } from "vitest";
import { calculateAndSavePogrebiDefsUtil } from "../calculateAndSavePogrebiDefsUtil.js";
// Мокаем зависимости
vi.mock("../../../../../poses/utils/getPogrebiDefStocks.js", () => ({
    getPogrebiDefStocks: vi.fn(),
}));
vi.mock("../../../../utils/getSharikStocksWithProgress.js", () => ({
    getSharikStocksWithProgress: vi.fn(),
}));
vi.mock("../../../../utils/getArtLimits.js", () => ({
    getArtLimits: vi.fn(),
}));
vi.mock("../../../../utils/filterDeficits.js", () => ({
    filterDeficits: vi.fn(),
}));
vi.mock("../../../../utils/calculationStatus.js", () => ({
    startCalculationTracking: vi.fn(),
    updateCalculationProgress: vi.fn(),
    finishCalculationTracking: vi.fn(),
}));
vi.mock("../../../../utils/calculateTotals.js", () => ({
    calculateDeficitTotals: vi.fn(),
}));
vi.mock("../../../../models/Def.js", () => ({
    Def: vi.fn().mockImplementation((data) => ({
        save: vi.fn().mockResolvedValue({
            ...data,
            _id: "test-id",
            createdAt: new Date("2024-01-15T10:00:00.000Z"),
            __v: 0,
            updatedAt: new Date("2024-01-15T10:00:00.000Z"),
        }),
    })),
}));
vi.mock("../defs-tg-notifications/sendDefCalculationStartNotification.js", () => ({
    sendDefCalculationStartNotification: vi.fn(),
}));
vi.mock("../defs-tg-notifications/sendDefCalculationCompleteNotification.js", () => ({
    sendDefCalculationCompleteNotification: vi.fn(),
}));
vi.mock("../defs-tg-notifications/sendDefCalculationErrorNotification.js", () => ({
    sendDefCalculationErrorNotification: vi.fn(),
}));
import { getPogrebiDefStocks } from "../../../../../poses/utils/getPogrebiDefStocks.js";
import { finishCalculationTracking, startCalculationTracking, updateCalculationProgress, } from "../../../../utils/calculationStatus.js";
import { calculateDeficitTotals } from "../../../../utils/calculateTotals.js";
import { sendDefCalculationCompleteNotification } from "../defs-tg-notifications/sendDefCalculationCompleteNotification.js";
import { sendDefCalculationErrorNotification } from "../defs-tg-notifications/sendDefCalculationErrorNotification.js";
import { sendDefCalculationStartNotification } from "../defs-tg-notifications/sendDefCalculationStartNotification.js";
import { filterDeficits } from "../../../../utils/filterDeficits.js";
import { getArtLimits } from "../../../../utils/getArtLimits.js";
import { getSharikStocksWithProgress } from "../../../../utils/getSharikStocksWithProgress.js";
describe("calculateAndSavePogrebiDefsUtil", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it("должна корректно выполнять полный цикл расчета и сохранения", async () => {
        const mockPogrebiStocks = {
            ART001: { nameukr: "Товар 1", quant: 10, boxes: 2 },
            ART002: { nameukr: "Товар 2", quant: 5, boxes: 1 },
        };
        const mockLimits = {
            ART001: 20,
            ART002: 5,
        };
        const mockSharikData = {
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
        };
        const mockFilteredData = {
            ART001: {
                nameukr: "Товар 1",
                quant: 10,
                sharikQuant: 5,
                difQuant: -5,
                defLimit: 30,
                status: "critical",
            },
        };
        const mockTotals = {
            total: 1,
            totalCriticalDefs: 1,
            totalLimitDefs: 0,
        };
        // Настраиваем моки
        getPogrebiDefStocks.mockResolvedValue(mockPogrebiStocks);
        getArtLimits.mockResolvedValue(mockLimits);
        getSharikStocksWithProgress.mockResolvedValue(mockSharikData);
        filterDeficits.mockReturnValue(mockFilteredData);
        calculateDeficitTotals.mockReturnValue(mockTotals);
        // Выполняем тест
        const result = await calculateAndSavePogrebiDefsUtil();
        // Проверяем последовательность вызовов
        expect(sendDefCalculationStartNotification).toHaveBeenCalledTimes(1);
        expect(getPogrebiDefStocks).toHaveBeenCalledTimes(1);
        expect(startCalculationTracking).toHaveBeenCalledWith(4); // 2 артикула + 2 дополнительных шага
        expect(updateCalculationProgress).toHaveBeenCalled();
        expect(getArtLimits).toHaveBeenCalledWith(["ART001", "ART002"]);
        expect(getSharikStocksWithProgress).toHaveBeenCalledWith(mockPogrebiStocks, mockLimits);
        expect(filterDeficits).toHaveBeenCalledWith(mockSharikData);
        expect(calculateDeficitTotals).toHaveBeenCalledWith(mockFilteredData);
        expect(sendDefCalculationCompleteNotification).toHaveBeenCalledWith(mockFilteredData);
        expect(finishCalculationTracking).toHaveBeenCalledTimes(1);
        // Проверяем результат
        expect(result).toMatchObject({
            result: mockFilteredData,
            total: 1,
            totalCriticalDefs: 1,
            totalLimitDefs: 0,
        });
        expect(result._id).toBeDefined();
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
    });
    it("должна обрабатывать пустой результат", async () => {
        const mockPogrebiStocks = {};
        const mockLimits = {};
        const mockSharikData = {};
        const mockFilteredData = {};
        const mockTotals = {
            total: 0,
            totalCriticalDefs: 0,
            totalLimitDefs: 0,
        };
        getPogrebiDefStocks.mockResolvedValue(mockPogrebiStocks);
        getArtLimits.mockResolvedValue(mockLimits);
        getSharikStocksWithProgress.mockResolvedValue(mockSharikData);
        filterDeficits.mockReturnValue(mockFilteredData);
        calculateDeficitTotals.mockReturnValue(mockTotals);
        const result = await calculateAndSavePogrebiDefsUtil();
        expect(startCalculationTracking).toHaveBeenCalledWith(2); // 0 артикулов + 2 дополнительных шага
        expect(result).toBeDefined();
        expect(result.total).toBe(0);
    });
    it("должна обрабатывать ошибки и завершать отслеживание", async () => {
        const error = new Error("Database connection failed");
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });
        getPogrebiDefStocks.mockRejectedValue(error);
        await expect(calculateAndSavePogrebiDefsUtil()).rejects.toThrow("Не вдалося розрахувати і зберегти дефіцити: Database connection failed");
        expect(sendDefCalculationStartNotification).toHaveBeenCalledTimes(1);
        expect(finishCalculationTracking).toHaveBeenCalledTimes(1);
        expect(sendDefCalculationErrorNotification).toHaveBeenCalledWith(error);
        expect(consoleSpy).toHaveBeenCalledWith("Помилка в calculateAndSavePogrebiDefs:", error);
        consoleSpy.mockRestore();
    });
    it("должна обрабатывать ошибки без message", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });
        getPogrebiDefStocks.mockRejectedValue("String error");
        await expect(calculateAndSavePogrebiDefsUtil()).rejects.toThrow("Не вдалося розрахувати і зберегти дефіцити: Невідома помилка");
        expect(finishCalculationTracking).toHaveBeenCalledTimes(1);
        expect(sendDefCalculationErrorNotification).toHaveBeenCalledWith("String error");
        consoleSpy.mockRestore();
    });
    it("должна правильно рассчитывать общее количество шагов", async () => {
        const mockPogrebiStocks = {
            ART001: { nameukr: "Товар 1", quant: 10, boxes: 2 },
            ART002: { nameukr: "Товар 2", quant: 5, boxes: 1 },
            ART003: { nameukr: "Товар 3", quant: 15, boxes: 3 },
        };
        const mockTotals = {
            total: 0,
            totalCriticalDefs: 0,
            totalLimitDefs: 0,
        };
        getPogrebiDefStocks.mockResolvedValue(mockPogrebiStocks);
        getArtLimits.mockResolvedValue({});
        getSharikStocksWithProgress.mockResolvedValue({});
        filterDeficits.mockReturnValue({});
        calculateDeficitTotals.mockReturnValue(mockTotals);
        await calculateAndSavePogrebiDefsUtil();
        // 3 артикула + 2 дополнительных шага (получение лимитов и сохранение)
        expect(startCalculationTracking).toHaveBeenCalledWith(5);
    });
});
