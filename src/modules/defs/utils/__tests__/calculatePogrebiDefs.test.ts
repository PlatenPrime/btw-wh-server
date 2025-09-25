import { beforeEach, describe, expect, it, vi } from "vitest";
import { calculatePogrebiDefs } from "../calculatePogrebiDefs.js";

// Мокаем зависимости
vi.mock("../../../poses/utils/getPogrebiDefStocks.js", () => ({
  getPogrebiDefStocks: vi.fn(),
}));

vi.mock("../../../poses/utils/getSharikStocks.js", () => ({
  getSharikStocks: vi.fn(),
}));

vi.mock("../getArtLimits.js", () => ({
  getArtLimits: vi.fn(),
}));

vi.mock("../filterDeficits.js", () => ({
  filterDeficits: vi.fn(),
}));

import { getPogrebiDefStocks } from "../../../poses/utils/getPogrebiDefStocks.js";
import { getSharikStocks } from "../../../poses/utils/getSharikStocks.js";
import { filterDeficits } from "../filterDeficits.js";
import { getArtLimits } from "../getArtLimits.js";

describe("calculatePogrebiDefs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должна корректно вызывать все функции в правильном порядке", async () => {
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
      ART001: mockSharikData["ART001"],
      ART002: mockSharikData["ART002"],
    };

    // Настраиваем моки
    (getPogrebiDefStocks as any).mockResolvedValue(mockPogrebiStocks);
    (getArtLimits as any).mockResolvedValue(mockLimits);
    (getSharikStocks as any).mockResolvedValue(mockSharikData);
    (filterDeficits as any).mockReturnValue(mockFilteredData);

    // Выполняем тест
    const result = await calculatePogrebiDefs();

    // Проверяем, что все функции были вызваны с правильными параметрами
    expect(getPogrebiDefStocks).toHaveBeenCalledTimes(1);
    expect(getArtLimits).toHaveBeenCalledWith(["ART001", "ART002"]);
    expect(getSharikStocks).toHaveBeenCalledWith(mockPogrebiStocks, mockLimits);
    expect(filterDeficits).toHaveBeenCalledWith(mockSharikData);

    // Проверяем результат
    expect(result).toBe(mockFilteredData);
  });

  it("должна обрабатывать пустой результат от getPogrebiDefStocks", async () => {
    const mockPogrebiStocks = {};
    const mockLimits = {};
    const mockSharikData = {};
    const mockFilteredData = {};

    (getPogrebiDefStocks as any).mockResolvedValue(mockPogrebiStocks);
    (getArtLimits as any).mockResolvedValue(mockLimits);
    (getSharikStocks as any).mockResolvedValue(mockSharikData);
    (filterDeficits as any).mockReturnValue(mockFilteredData);

    const result = await calculatePogrebiDefs();

    expect(getArtLimits).toHaveBeenCalledWith([]);
    expect(getSharikStocks).toHaveBeenCalledWith({}, {});
    expect(filterDeficits).toHaveBeenCalledWith({});
    expect(result).toBe(mockFilteredData);
  });

  it("должна передавать ошибки от зависимостей", async () => {
    const error = new Error("Database connection failed");
    (getPogrebiDefStocks as any).mockRejectedValue(error);

    await expect(calculatePogrebiDefs()).rejects.toThrow(
      "Database connection failed"
    );
  });

  it("должна обрабатывать ошибки от getArtLimits", async () => {
    const mockPogrebiStocks = {
      ART001: { nameukr: "Товар 1", quant: 10, boxes: 2 },
    };
    const error = new Error("Art limits query failed");

    (getPogrebiDefStocks as any).mockResolvedValue(mockPogrebiStocks);
    (getArtLimits as any).mockRejectedValue(error);

    await expect(calculatePogrebiDefs()).rejects.toThrow(
      "Art limits query failed"
    );
  });

  it("должна обрабатывать ошибки от getSharikStocks", async () => {
    const mockPogrebiStocks = {
      ART001: { nameukr: "Товар 1", quant: 10, boxes: 2 },
    };
    const mockLimits = { ART001: 20 };
    const error = new Error("Sharik API failed");

    (getPogrebiDefStocks as any).mockResolvedValue(mockPogrebiStocks);
    (getArtLimits as any).mockResolvedValue(mockLimits);
    (getSharikStocks as any).mockRejectedValue(error);

    await expect(calculatePogrebiDefs()).rejects.toThrow("Sharik API failed");
  });

  it("должна обрабатывать ошибки от filterDeficits", async () => {
    const mockPogrebiStocks = {
      ART001: { nameukr: "Товар 1", quant: 10, boxes: 2 },
    };
    const mockLimits = { ART001: 20 };
    const mockSharikData = {
      ART001: {
        nameukr: "Товар 1",
        quant: 10,
        boxes: 2,
        sharikQuant: 5,
        difQuant: -5,
        limit: 20,
      },
    };
    const error = new Error("Filter processing failed");

    (getPogrebiDefStocks as any).mockResolvedValue(mockPogrebiStocks);
    (getArtLimits as any).mockResolvedValue(mockLimits);
    (getSharikStocks as any).mockResolvedValue(mockSharikData);
    (filterDeficits as any).mockImplementation(() => {
      throw error;
    });

    await expect(calculatePogrebiDefs()).rejects.toThrow(
      "Filter processing failed"
    );
  });
});
