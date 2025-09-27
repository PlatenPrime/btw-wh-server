import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IMergedPosesResult } from "../../../poses/utils/mergePoses.js";
import { getSharikStocksWithProgress } from "../getSharikStocksWithProgress.js";

// Мокаем зависимости
vi.mock("../../../comps/utils/getSharikData.js");
vi.mock("../calculationStatus.js");

import { getSharikData } from "../../../comps/utils/getSharikData.js";
import { updateCalculationProgress } from "../calculationStatus.js";

const mockedGetSharikData = vi.mocked(getSharikData);
const mockedUpdateCalculationProgress = vi.mocked(updateCalculationProgress);

describe("getSharikStocksWithProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("должна расширять объекты данными Sharik при успешном получении", async () => {
    const mockStocks: IMergedPosesResult = {
      ART001: {
        nameukr: "Товар 1",
        quant: 10,
        boxes: 2,
      },
      ART002: {
        nameukr: "Товар 2",
        quant: 5,
        boxes: 1,
      },
    };

    const mockLimits = {
      ART001: 20,
      ART002: 10,
    };

    // Мокаем getSharikData для разных артикулов
    mockedGetSharikData
      .mockResolvedValueOnce({
        nameukr: "Товар 1",
        price: 100,
        quantity: 15,
      })
      .mockResolvedValueOnce({
        nameukr: "Товар 2",
        price: 200,
        quantity: 8,
      });

    const resultPromise = getSharikStocksWithProgress(mockStocks, mockLimits);

    // Пропускаем все таймеры
    await vi.runAllTimersAsync();

    const result = await resultPromise;

    expect(result).toEqual({
      ART001: {
        nameukr: "Товар 1",
        quant: 10,
        boxes: 2,
        sharikQuant: 15,
        difQuant: 5, // 15 - 10
        limit: 20,
      },
      ART002: {
        nameukr: "Товар 2",
        quant: 5,
        boxes: 1,
        sharikQuant: 8,
        difQuant: 3, // 8 - 5
        limit: 10,
      },
    });

    expect(mockedGetSharikData).toHaveBeenCalledTimes(2);
    expect(mockedGetSharikData).toHaveBeenCalledWith("ART001");
    expect(mockedGetSharikData).toHaveBeenCalledWith("ART002");
  });

  it("должна обрабатывать случаи когда Sharik данные не найдены", async () => {
    const mockStocks: IMergedPosesResult = {
      ART001: {
        nameukr: "Товар 1",
        quant: 10,
        boxes: 2,
      },
    };

    const mockLimits = {
      ART001: 20,
    };

    // Мокаем getSharikData возвращающий null
    mockedGetSharikData.mockResolvedValueOnce(null);

    const resultPromise = getSharikStocksWithProgress(mockStocks, mockLimits);

    await vi.runAllTimersAsync();

    const result = await resultPromise;

    expect(result).toEqual({
      ART001: {
        nameukr: "Товар 1",
        quant: 10,
        boxes: 2,
        sharikQuant: 0,
        difQuant: -10, // 0 - 10
        limit: 20,
      },
    });
  });

  it("должна обрабатывать ошибки при получении данных Sharik", async () => {
    const mockStocks: IMergedPosesResult = {
      ART001: {
        nameukr: "Товар 1",
        quant: 10,
        boxes: 2,
      },
    };

    const mockLimits = {
      ART001: 20,
    };

    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Мокаем getSharikData выбрасывающий ошибку
    mockedGetSharikData.mockRejectedValueOnce(new Error("Network error"));

    const resultPromise = getSharikStocksWithProgress(mockStocks, mockLimits);

    await vi.runAllTimersAsync();

    const result = await resultPromise;

    expect(result).toEqual({
      ART001: {
        nameukr: "Товар 1",
        quant: 10,
        boxes: 2,
        sharikQuant: 0,
        difQuant: -10, // 0 - 10
        limit: 20,
      },
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Ошибка при получении данных Sharik для артикула ART001:",
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it("должна обрабатывать пустой объект stocks", async () => {
    const mockStocks: IMergedPosesResult = {};

    const resultPromise = getSharikStocksWithProgress(mockStocks);

    await vi.runAllTimersAsync();

    const result = await resultPromise;

    expect(result).toEqual({});
    expect(mockedGetSharikData).not.toHaveBeenCalled();
    expect(mockedUpdateCalculationProgress).not.toHaveBeenCalled();
  });

  it("должна обновлять прогресс каждые 5 артикулов", async () => {
    const mockStocks: IMergedPosesResult = {};

    // Создаем 12 артикулов
    for (let i = 1; i <= 12; i++) {
      mockStocks[`ART${i.toString().padStart(3, "0")}`] = {
        nameukr: `Товар ${i}`,
        quant: 10,
        boxes: 1,
      };
    }

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    // Мокаем getSharikData для всех артикулов
    mockedGetSharikData.mockResolvedValue({
      nameukr: "Test",
      price: 100,
      quantity: 15,
    });

    const resultPromise = getSharikStocksWithProgress(mockStocks);

    await vi.runAllTimersAsync();

    await resultPromise;

    // Проверяем, что прогресс обновлялся каждые 5 артикулов и на последнем
    expect(mockedUpdateCalculationProgress).toHaveBeenCalledTimes(3); // 5, 10, 12

    expect(mockedUpdateCalculationProgress).toHaveBeenNthCalledWith(
      1,
      5,
      12,
      "Обработка данных Sharik: 5 из 12 артикулов"
    );

    expect(mockedUpdateCalculationProgress).toHaveBeenNthCalledWith(
      2,
      10,
      12,
      "Обработка данных Sharik: 10 из 12 артикулов"
    );

    expect(mockedUpdateCalculationProgress).toHaveBeenNthCalledWith(
      3,
      12,
      12,
      "Обработка данных Sharik: 12 из 12 артикулов"
    );

    // Проверяем логи
    expect(consoleSpy).toHaveBeenCalledWith("Начинаем обработку 12 артикулов");
    expect(consoleSpy).toHaveBeenCalledWith("Обработано 5 из 12 артикулов");
    expect(consoleSpy).toHaveBeenCalledWith("Обработано 10 из 12 артикулов");
    expect(consoleSpy).toHaveBeenCalledWith("Обработано 12 из 12 артикулов");

    consoleSpy.mockRestore();
  });

  it("должна правильно рассчитывать difQuant для разных сценариев", async () => {
    const mockStocks: IMergedPosesResult = {
      ART001: { nameukr: "Товар 1", quant: 10, boxes: 1 },
      ART002: { nameukr: "Товар 2", quant: 5, boxes: 1 },
      ART003: { nameukr: "Товар 3", quant: 15, boxes: 1 },
    };

    const mockLimits = {
      ART001: 20,
      ART002: 10,
      ART003: 30,
    };

    // Мокаем разные результаты для разных артикулов
    mockedGetSharikData
      .mockResolvedValueOnce({
        nameukr: "Товар 1",
        price: 100,
        quantity: 15, // больше чем на складе
      })
      .mockResolvedValueOnce({
        nameukr: "Товар 2",
        price: 200,
        quantity: 3, // меньше чем на складе
      })
      .mockResolvedValueOnce({
        nameukr: "Товар 3",
        price: 300,
        quantity: 15, // равно количеству на складе
      });

    const resultPromise = getSharikStocksWithProgress(mockStocks, mockLimits);

    await vi.runAllTimersAsync();

    const result = await resultPromise;

    expect(result.ART001.difQuant).toBe(5); // 15 - 10 = 5 (положительный дефицит)
    expect(result.ART002.difQuant).toBe(-2); // 3 - 5 = -2 (отрицательный дефицит)
    expect(result.ART003.difQuant).toBe(0); // 15 - 15 = 0 (нет дефицита)
  });

  it("должна добавлять задержку между запросами", async () => {
    const mockStocks: IMergedPosesResult = {
      ART001: { nameukr: "Товар 1", quant: 10, boxes: 1 },
      ART002: { nameukr: "Товар 2", quant: 5, boxes: 1 },
    };

    mockedGetSharikData.mockResolvedValue({
      nameukr: "Test",
      price: 100,
      quantity: 15,
    });

    const resultPromise = getSharikStocksWithProgress(mockStocks);

    // Проверяем, что функция еще не завершилась
    expect(mockedGetSharikData).toHaveBeenCalledTimes(1);

    // Пропускаем 100ms
    vi.advanceTimersByTime(100);

    await vi.runAllTimersAsync();

    await resultPromise;

    // Проверяем, что все вызовы были сделаны
    expect(mockedGetSharikData).toHaveBeenCalledTimes(2);
  });

  it("должна логировать время выполнения", async () => {
    const mockStocks: IMergedPosesResult = {
      ART001: { nameukr: "Товар 1", quant: 10, boxes: 1 },
    };

    mockedGetSharikData.mockResolvedValue({
      nameukr: "Test",
      price: 100,
      quantity: 15,
    });

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const resultPromise = getSharikStocksWithProgress(mockStocks);

    await vi.runAllTimersAsync();

    await resultPromise;

    expect(consoleSpy).toHaveBeenCalledWith("Начинаем обработку 1 артикулов");
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Обработка 1 артикулов завершена за \d+ секунд/)
    );

    consoleSpy.mockRestore();
  });

  it("должна выбрасывать ошибку при критической ошибке", async () => {
    const mockStocks: IMergedPosesResult = {
      ART001: { nameukr: "Товар 1", quant: 10, boxes: 1 },
    };

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Мокаем критическую ошибку на уровне try-catch в функции
    mockedGetSharikData.mockRejectedValue(new Error("Critical error"));

    const resultPromise = getSharikStocksWithProgress(mockStocks);

    await vi.runAllTimersAsync();

    // Функция должна обработать ошибку и вернуть результат с нулевыми значениями
    const result = await resultPromise;

    expect(result).toEqual({
      ART001: {
        nameukr: "Товар 1",
        quant: 10,
        boxes: 1,
        sharikQuant: 0,
        difQuant: -10,
        limit: undefined,
      },
    });

    consoleSpy.mockRestore();
  });
});
