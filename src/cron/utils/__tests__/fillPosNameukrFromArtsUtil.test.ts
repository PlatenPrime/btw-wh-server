import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fillPosNameukrFromArtsUtil } from "../fillPosNameukrFromArtsUtil.js";

const mockDistinct = vi.fn();
const mockFind = vi.fn();
const mockBulkWrite = vi.fn();

vi.mock("../../../modules/poses/models/Pos.js", () => ({
  Pos: {
    distinct: (...args: unknown[]) => mockDistinct(...args),
    bulkWrite: (...args: unknown[]) => mockBulkWrite(...args),
  },
}));

vi.mock("../../../modules/arts/models/Art.js", () => ({
  Art: {
    find: (...args: unknown[]) => ({ select: () => ({ lean: () => ({ exec: () => mockFind(...args) }) }) }),
  },
}));

describe("fillPosNameukrFromArtsUtil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("возвращает нули, если нет позиций без nameukr", async () => {
    mockDistinct.mockResolvedValue([]);

    const result = await fillPosNameukrFromArtsUtil();

    expect(result).toEqual({ updatedCount: 0, skippedArtikulsCount: 0 });
    expect(mockDistinct).toHaveBeenCalledTimes(1);
    expect(mockFind).not.toHaveBeenCalled();
    expect(mockBulkWrite).not.toHaveBeenCalled();
  });

  it("возвращает updatedCount 0 и skippedArtikulsCount, если у всех артикулов нет Art с nameukr", async () => {
    mockDistinct.mockResolvedValue(["ART-A", "ART-B"]);
    mockFind.mockResolvedValue([]);

    const result = await fillPosNameukrFromArtsUtil();

    expect(result).toEqual({ updatedCount: 0, skippedArtikulsCount: 2 });
    expect(mockDistinct).toHaveBeenCalledTimes(1);
    expect(mockFind).toHaveBeenCalledTimes(1);
    expect(mockBulkWrite).not.toHaveBeenCalled();
  });

  it("обновляет позиции только для артикулов, у которых есть Art с непустым nameukr", async () => {
    mockDistinct.mockResolvedValue(["ART-A", "ART-B", "ART-C"]);
    mockFind.mockResolvedValue([
      { artikul: "ART-A", nameukr: "Назва А" },
      { artikul: "ART-C", nameukr: "Назва С" },
    ]);
    mockBulkWrite.mockResolvedValue({ modifiedCount: 5 });

    const result = await fillPosNameukrFromArtsUtil();

    expect(result).toEqual({ updatedCount: 5, skippedArtikulsCount: 1 });
    expect(mockDistinct).toHaveBeenCalledTimes(1);
    expect(mockFind).toHaveBeenCalledTimes(1);
    expect(mockBulkWrite).toHaveBeenCalledTimes(1);

    const operations = mockBulkWrite.mock.calls[0][0];
    expect(operations).toHaveLength(2);
    expect(operations[0].updateMany.filter.artikul).toBe("ART-A");
    expect(operations[0].updateMany.update.$set.nameukr).toBe("Назва А");
    expect(operations[1].updateMany.filter.artikul).toBe("ART-C");
    expect(operations[1].updateMany.update.$set.nameukr).toBe("Назва С");
  });

  it("не подставляет nameukr из Art, если у Art пустой или пробельный nameukr", async () => {
    mockDistinct.mockResolvedValue(["ART-EMPTY"]);
    mockFind.mockResolvedValue([
      { artikul: "ART-EMPTY", nameukr: "" },
      { artikul: "ART-EMPTY", nameukr: "   " },
    ]);

    const result = await fillPosNameukrFromArtsUtil();

    expect(result).toEqual({ updatedCount: 0, skippedArtikulsCount: 1 });
    expect(mockBulkWrite).not.toHaveBeenCalled();
  });

  it("триммирует nameukr из Art перед записью", async () => {
    mockDistinct.mockResolvedValue(["ART-TRIM"]);
    mockFind.mockResolvedValue([{ artikul: "ART-TRIM", nameukr: "  Назва  " }]);
    mockBulkWrite.mockResolvedValue({ modifiedCount: 1 });

    await fillPosNameukrFromArtsUtil();

    const operations = mockBulkWrite.mock.calls[0][0];
    expect(operations[0].updateMany.update.$set.nameukr).toBe("Назва");
  });

  it("выполняет минимальное число запросов: 1 distinct, 1 find, 1 bulkWrite", async () => {
    mockDistinct.mockResolvedValue(["ART-1"]);
    mockFind.mockResolvedValue([{ artikul: "ART-1", nameukr: "Name" }]);
    mockBulkWrite.mockResolvedValue({ modifiedCount: 2 });

    await fillPosNameukrFromArtsUtil();

    expect(mockDistinct).toHaveBeenCalledTimes(1);
    expect(mockFind).toHaveBeenCalledTimes(1);
    expect(mockBulkWrite).toHaveBeenCalledTimes(1);
  });
});
