import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Pos } from "../../models/Pos.js";
import { getSkladStocks } from "../getSkladStocks.js";

// Упрощенный интерфейс для тестов
interface ITestPos {
  _id: string;
  artikul: string;
  nameukr?: string;
  quant: number;
  boxes: number;
  sklad?: string;
  pallet: any;
  row: any;
  createdAt: Date;
  updatedAt: Date;
}

describe("getSkladStocks", () => {
  // Сохраняем оригинальные методы
  let originalFind: any;

  beforeEach(() => {
    // Сохраняем оригинальный метод find
    originalFind = Pos.find;
  });

  afterEach(() => {
    // Восстанавливаем оригинальный метод
    Pos.find = originalFind;
  });

  it("должна возвращать объединенные позиции для склада по умолчанию (pogrebi)", async () => {
    const mockPoses: ITestPos[] = [
      {
        _id: "1",
        artikul: "ART001",
        nameukr: "Товар 1",
        quant: 10,
        boxes: 2,
        sklad: "pogrebi",
        pallet: "pallet1" as any,
        row: "row1" as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "2",
        artikul: "ART002",
        nameukr: "Товар 2",
        quant: 5,
        boxes: 1,
        sklad: "pogrebi",
        pallet: "pallet2" as any,
        row: "row2" as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Мокаем Pos.find напрямую
    Pos.find = vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockPoses),
    });

    const result = await getSkladStocks();

    expect(Pos.find).toHaveBeenCalledWith({
      sklad: "pogrebi",
      quant: { $ne: 0 },
    });

    // Проверяем, что результат содержит объединенные позиции
    expect(result).toHaveProperty("ART001");
    expect(result).toHaveProperty("ART002");
    expect(result.ART001).toEqual({
      nameukr: "Товар 1",
      quant: 10,
      boxes: 2,
    });
    expect(result.ART002).toEqual({
      nameukr: "Товар 2",
      quant: 5,
      boxes: 1,
    });
  });

  it("должна возвращать объединенные позиции для указанного склада", async () => {
    const mockPoses: ITestPos[] = [
      {
        _id: "1",
        artikul: "ART001",
        nameukr: "Товар 1",
        quant: 15,
        boxes: 3,
        sklad: "magazin",
        pallet: "pallet1" as any,
        row: "row1" as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    Pos.find = vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockPoses),
    });

    const result = await getSkladStocks("magazin");

    expect(Pos.find).toHaveBeenCalledWith({
      sklad: "magazin",
      quant: { $ne: 0 },
    });

    expect(result).toHaveProperty("ART001");
    expect(result.ART001).toEqual({
      nameukr: "Товар 1",
      quant: 15,
      boxes: 3,
    });
  });

  it("должна фильтровать позиции с нулевым количеством", async () => {
    const mockPoses: ITestPos[] = [
      {
        _id: "1",
        artikul: "ART001",
        nameukr: "Товар 1",
        quant: 10,
        boxes: 2,
        sklad: "pogrebi",
        pallet: "pallet1" as any,
        row: "row1" as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    Pos.find = vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockPoses),
    });

    const result = await getSkladStocks();

    expect(Pos.find).toHaveBeenCalledWith({
      sklad: "pogrebi",
      quant: { $ne: 0 },
    });

    expect(result).toHaveProperty("ART001");
    expect(result.ART001).toEqual({
      nameukr: "Товар 1",
      quant: 10,
      boxes: 2,
    });
  });

  it("должна возвращать пустой объект если позиций не найдено", async () => {
    Pos.find = vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue([]),
    });

    const result = await getSkladStocks("empty_sklad");

    expect(Pos.find).toHaveBeenCalledWith({
      sklad: "empty_sklad",
      quant: { $ne: 0 },
    });
    expect(result).toEqual({});
  });

  it("должна обрабатывать ошибки базы данных", async () => {
    const dbError = new Error("Database connection failed");

    Pos.find = vi.fn().mockReturnValue({
      exec: vi.fn().mockRejectedValue(dbError),
    });

    await expect(getSkladStocks()).rejects.toThrow(
      "Database connection failed"
    );
  });

  it("должна объединять позиции с одинаковыми артикулами", async () => {
    const mockPoses: ITestPos[] = [
      {
        _id: "1",
        artikul: "ART001",
        nameukr: "Товар 1",
        quant: 10,
        boxes: 2,
        sklad: "pogrebi",
        pallet: "pallet1" as any,
        row: "row1" as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "2",
        artikul: "ART001", // Тот же артикул
        nameukr: "Товар 1",
        quant: 5,
        boxes: 1,
        sklad: "pogrebi",
        pallet: "pallet2" as any,
        row: "row2" as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    Pos.find = vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockPoses),
    });

    const result = await getSkladStocks();

    expect(Pos.find).toHaveBeenCalledWith({
      sklad: "pogrebi",
      quant: { $ne: 0 },
    });

    // Проверяем, что позиции объединились
    expect(result).toHaveProperty("ART001");
    expect(result.ART001).toEqual({
      nameukr: "Товар 1",
      quant: 15, // 10 + 5
      boxes: 3, // 2 + 1
    });
  });
});
