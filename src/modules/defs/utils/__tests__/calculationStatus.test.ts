import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  finishCalculationTracking,
  getCalculationStatus,
  resetCalculationStatus,
  startCalculationTracking,
  updateCalculationProgress,
  updateCalculationStatus,
} from "../calculationStatus.js";

describe("calculationStatus", () => {
  beforeEach(() => {
    // Сбрасываем состояние перед каждым тестом
    resetCalculationStatus();
  });

  describe("getCalculationStatus", () => {
    it("должен возвращать начальное состояние", () => {
      const status = getCalculationStatus();

      expect(status).toEqual({
        isRunning: false,
        progress: 0,
        estimatedTimeRemaining: 0,
        startedAt: null,
        lastUpdate: expect.any(String),
        currentStep: undefined,
        totalItems: undefined,
        processedItems: undefined,
      });
    });

    it("должен возвращать копию состояния, а не ссылку", () => {
      const status1 = getCalculationStatus();
      const status2 = getCalculationStatus();

      expect(status1).not.toBe(status2);
      expect(status1).toEqual(status2);
    });
  });

  describe("updateCalculationStatus", () => {
    it("должен обновлять статус и устанавливать lastUpdate", () => {
      const updates = {
        isRunning: true,
        progress: 50,
        currentStep: "Test step",
      };

      updateCalculationStatus(updates);
      const status = getCalculationStatus();

      expect(status.isRunning).toBe(true);
      expect(status.progress).toBe(50);
      expect(status.currentStep).toBe("Test step");
      expect(status.lastUpdate).toBeTruthy();
      expect(new Date(status.lastUpdate!)).toBeInstanceOf(Date);
    });

    it("должен сохранять существующие значения при частичном обновлении", () => {
      updateCalculationStatus({
        isRunning: true,
        progress: 30,
        totalItems: 100,
      });

      updateCalculationStatus({
        progress: 50,
      });

      const status = getCalculationStatus();

      expect(status.isRunning).toBe(true);
      expect(status.progress).toBe(50);
      expect(status.totalItems).toBe(100);
    });
  });

  describe("resetCalculationStatus", () => {
    it("должен сбрасывать статус к начальному состоянию", () => {
      updateCalculationStatus({
        isRunning: true,
        progress: 75,
        totalItems: 100,
        processedItems: 75,
        currentStep: "Processing",
      });

      resetCalculationStatus();
      const status = getCalculationStatus();

      expect(status).toEqual({
        isRunning: false,
        progress: 0,
        estimatedTimeRemaining: 0,
        startedAt: null,
        lastUpdate: expect.any(String),
        currentStep: undefined,
        totalItems: undefined,
        processedItems: undefined,
      });
    });
  });

  describe("startCalculationTracking", () => {
    it("должен запускать отслеживание с правильными параметрами", () => {
      const totalItems = 100;

      startCalculationTracking(totalItems);
      const status = getCalculationStatus();

      expect(status.isRunning).toBe(true);
      expect(status.progress).toBe(0);
      expect(status.estimatedTimeRemaining).toBe(0);
      expect(status.totalItems).toBe(totalItems);
      expect(status.processedItems).toBe(0);
      expect(status.startedAt).toBeTruthy();
      expect(status.currentStep).toBe("Ініціалізація розрахунку...");
      expect(new Date(status.startedAt!)).toBeInstanceOf(Date);
    });
  });

  describe("updateCalculationProgress", () => {
    beforeEach(() => {
      // Мокаем Date для предсказуемых тестов
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-15T10:00:00.000Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("должен обновлять прогресс и рассчитывать оставшееся время", () => {
      startCalculationTracking(100);

      // Перемещаем время вперед на 10 секунд
      vi.advanceTimersByTime(10000);

      updateCalculationProgress(25, 100, "Test step");
      const status = getCalculationStatus();

      expect(status.progress).toBe(25);
      expect(status.processedItems).toBe(25);
      expect(status.totalItems).toBe(100);
      expect(status.currentStep).toBe("Test step");
      expect(status.estimatedTimeRemaining).toBeGreaterThan(0);
    });

    it("должен правильно рассчитывать прогресс в процентах", () => {
      startCalculationTracking(100);

      updateCalculationProgress(50, 100);
      const status = getCalculationStatus();

      expect(status.progress).toBe(50);
    });

    it("должен обрабатывать случай с нулевыми обработанными элементами", () => {
      startCalculationTracking(100);

      updateCalculationProgress(0, 100);
      const status = getCalculationStatus();

      expect(status.estimatedTimeRemaining).toBe(0);
    });

    it("должен округлять прогресс до целых чисел", () => {
      startCalculationTracking(3);

      updateCalculationProgress(1, 3);
      const status = getCalculationStatus();

      expect(status.progress).toBe(33); // Math.round(1/3 * 100) = 33
    });
  });

  describe("finishCalculationTracking", () => {
    it("должен завершать отслеживание с правильными параметрами", () => {
      startCalculationTracking(100);
      updateCalculationProgress(50, 100, "In progress");

      finishCalculationTracking();
      const status = getCalculationStatus();

      expect(status.isRunning).toBe(false);
      expect(status.progress).toBe(100);
      expect(status.estimatedTimeRemaining).toBe(0);
      expect(status.currentStep).toBe("Розрахунок завершено");
    });
  });

  describe("Интеграционные тесты", () => {
    it("должен корректно работать полный цикл расчета", () => {
      const totalItems = 50;

      // Запуск
      startCalculationTracking(totalItems);
      let status = getCalculationStatus();

      expect(status.isRunning).toBe(true);
      expect(status.progress).toBe(0);

      // Обновление прогресса
      updateCalculationProgress(25, totalItems, "Half done");
      status = getCalculationStatus();

      expect(status.progress).toBe(50);
      expect(status.currentStep).toBe("Half done");

      // Завершение
      finishCalculationTracking();
      status = getCalculationStatus();

      expect(status.isRunning).toBe(false);
      expect(status.progress).toBe(100);
      expect(status.currentStep).toBe("Розрахунок завершено");
    });

    it("должен корректно обрабатывать сброс во время выполнения", () => {
      startCalculationTracking(100);
      updateCalculationProgress(30, 100, "Processing");

      resetCalculationStatus();
      const status = getCalculationStatus();

      expect(status.isRunning).toBe(false);
      expect(status.progress).toBe(0);
      expect(status.currentStep).toBeUndefined();
    });
  });
});
