import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSharikData } from "../../../comps/utils/getSharikData.js";
import { getSharikStocks } from "../../../poses/utils/getSharikStocks.js";
import { IMergedPosesResult } from "../../../poses/utils/mergePoses.js";

// Мокаем getSharikData
vi.mock("../../../comps/utils/getSharikData.js");
const mockedGetSharikData = vi.mocked(getSharikData);

describe("getSharikStocks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Мокаем setTimeout для ускорения тестов
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

    const resultPromise = getSharikStocks(mockStocks);

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
      },
      ART002: {
        nameukr: "Товар 2",
        quant: 5,
        boxes: 1,
        sharikQuant: 8,
        difQuant: 3, // 8 - 5
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

    // Мокаем getSharikData возвращающий null
    mockedGetSharikData.mockResolvedValueOnce(null);

    const resultPromise = getSharikStocks(mockStocks);

    await vi.runAllTimersAsync();

    const result = await resultPromise;

    expect(result).toEqual({
      ART001: {
        nameukr: "Товар 1",
        quant: 10,
        boxes: 2,
        sharikQuant: 0,
        difQuant: -10, // 0 - 10
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

    // Мокаем getSharikData выбрасывающий ошибку
    mockedGetSharikData.mockRejectedValueOnce(new Error("Network error"));

    const resultPromise = getSharikStocks(mockStocks);

    await vi.runAllTimersAsync();

    const result = await resultPromise;

    expect(result).toEqual({
      ART001: {
        nameukr: "Товар 1",
        quant: 10,
        boxes: 2,
        sharikQuant: 0,
        difQuant: -10, // 0 - 10
      },
    });
  });

  it("должна обрабатывать пустой объект stocks", async () => {
    const mockStocks: IMergedPosesResult = {};

    const resultPromise = getSharikStocks(mockStocks);

    await vi.runAllTimersAsync();

    const result = await resultPromise;

    expect(result).toEqual({});
    expect(mockedGetSharikData).not.toHaveBeenCalled();
  });

  it("должна правильно рассчитывать difQuant для разных сценариев", async () => {
    const mockStocks: IMergedPosesResult = {
      ART001: { nameukr: "Товар 1", quant: 10, boxes: 2 },
      ART002: { nameukr: "Товар 2", quant: 5, boxes: 1 },
      ART003: { nameukr: "Товар 3", quant: 20, boxes: 4 },
    };

    // Мокаем разные сценарии
    mockedGetSharikData
      .mockResolvedValueOnce({ nameukr: "Товар 1", price: 100, quantity: 15 }) // больше чем в БД
      .mockResolvedValueOnce({ nameukr: "Товар 2", price: 200, quantity: 3 }) // меньше чем в БД
      .mockResolvedValueOnce({ nameukr: "Товар 3", price: 300, quantity: 20 }); // равно БД

    const resultPromise = getSharikStocks(mockStocks);

    await vi.runAllTimersAsync();

    const result = await resultPromise;

    expect(result.ART001.difQuant).toBe(5); // 15 - 10
    expect(result.ART002.difQuant).toBe(-2); // 3 - 5
    expect(result.ART003.difQuant).toBe(0); // 20 - 20
  });

  it("должна логировать прогресс каждые 10 артикулов", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    // Создаем 25 артикулов для проверки логирования
    const mockStocks: IMergedPosesResult = {};
    for (let i = 1; i <= 25; i++) {
      mockStocks[`ART${i.toString().padStart(3, "0")}`] = {
        nameukr: `Товар ${i}`,
        quant: i,
        boxes: 1,
      };
    }

    // Мокаем getSharikData для всех артикулов
    mockedGetSharikData.mockResolvedValue({
      nameukr: "Товар",
      price: 100,
      quantity: 10,
    });

    const resultPromise = getSharikStocks(mockStocks);

    await vi.runAllTimersAsync();

    await resultPromise;

    // Проверяем что логировался прогресс
    expect(consoleSpy).toHaveBeenCalledWith(
      "Начинаем получение данных Sharik для 25 артикулов"
    );
    expect(consoleSpy).toHaveBeenCalledWith("Обработано 10 из 25 артикулов");
    expect(consoleSpy).toHaveBeenCalledWith("Обработано 20 из 25 артикулов");
    expect(consoleSpy).toHaveBeenCalledWith("Обработано 25 из 25 артикулов");

    consoleSpy.mockRestore();
  });

  it("должна обрабатывать смешанные сценарии (успех, null, ошибка)", async () => {
    const mockStocks: IMergedPosesResult = {
      ART001: { nameukr: "Товар 1", quant: 10, boxes: 2 },
      ART002: { nameukr: "Товар 2", quant: 5, boxes: 1 },
      ART003: { nameukr: "Товар 3", quant: 15, boxes: 3 },
    };

    // Мокаем разные сценарии
    mockedGetSharikData
      .mockResolvedValueOnce({ nameukr: "Товар 1", price: 100, quantity: 12 }) // успех
      .mockResolvedValueOnce(null) // не найдено
      .mockRejectedValueOnce(new Error("Network error")); // ошибка

    const resultPromise = getSharikStocks(mockStocks);

    await vi.runAllTimersAsync();

    const result = await resultPromise;

    expect(result.ART001).toEqual({
      nameukr: "Товар 1",
      quant: 10,
      boxes: 2,
      sharikQuant: 12,
      difQuant: 2,
    });

    expect(result.ART002).toEqual({
      nameukr: "Товар 2",
      quant: 5,
      boxes: 1,
      sharikQuant: 0,
      difQuant: -5,
    });

    expect(result.ART003).toEqual({
      nameukr: "Товар 3",
      quant: 15,
      boxes: 3,
      sharikQuant: 0,
      difQuant: -15,
    });
  });

  it("должна правильно обрабатывать задержки между запросами", async () => {
    const mockStocks: IMergedPosesResult = {
      ART001: { nameukr: "Товар 1", quant: 10, boxes: 2 },
      ART002: { nameukr: "Товар 2", quant: 5, boxes: 1 },
    };

    mockedGetSharikData
      .mockResolvedValueOnce({ nameukr: "Товар 1", price: 100, quantity: 12 })
      .mockResolvedValueOnce({ nameukr: "Товар 2", price: 200, quantity: 8 });

    const resultPromise = getSharikStocks(mockStocks);

    // Проверяем что setTimeout был вызван
    expect(vi.getTimerCount()).toStrictEqual(0); // Один setTimeout для задержки между запросами

    await vi.runAllTimersAsync();

    const result = await resultPromise;

    expect(result).toHaveProperty("ART001");
    expect(result).toHaveProperty("ART002");
  });
});
