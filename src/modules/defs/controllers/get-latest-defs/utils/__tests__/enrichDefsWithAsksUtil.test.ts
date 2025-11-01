import { beforeEach, describe, expect, it, vi } from "vitest";
import { enrichDefsWithAsksUtil } from "../enrichDefsWithAsksUtil.js";

// Мокаем модель Ask
vi.mock("../../../../../asks/models/Ask.js", () => ({
  Ask: {
    find: vi.fn(),
  },
}));

import { Ask } from "../../../../../asks/models/Ask.js";
import { IDef } from "../../../../models/Def.js";

describe("enrichDefsWithAsksUtil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должна обогащать дефициты информацией о заявках", async () => {
    const mockLatestDef: any = {
      _id: "def-id",
      result: {
        ART001: {
          nameukr: "Товар 1",
          quant: 10,
          sharikQuant: 5,
          difQuant: -5,
          defLimit: 30,
          status: "critical",
        },
        ART002: {
          nameukr: "Товар 2",
          quant: 20,
          sharikQuant: 25,
          difQuant: 5,
          defLimit: 40,
          status: "limited",
        },
      },
      total: 2,
      totalCriticalDefs: 1,
      totalLimitDefs: 1,
      createdAt: new Date("2024-01-15T10:00:00.000Z"),
      updatedAt: new Date("2024-01-15T10:00:00.000Z"),
    };

    const mockAsks = [
      {
        _id: "ask-id-1" as any,
        artikul: "ART001",
        status: "new",
        createdAt: new Date("2024-01-10T10:00:00.000Z"),
        askerData: {
          fullname: "Иван Иванов",
          _id: "user-id-1" as any,
        },
      },
    ];

    const mockFind = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockAsks),
      }),
    });
    (Ask as any).find = mockFind;

    const result = await enrichDefsWithAsksUtil(mockLatestDef);

    expect(mockFind).toHaveBeenCalledWith({
      artikul: { $in: ["ART001", "ART002"] },
      status: { $in: ["new"] },
    });
    expect(result).toBeDefined();
    expect(result.ART001).toHaveProperty("existingAsk");
    expect(result.ART001.existingAsk).not.toBeNull();
    expect(result.ART001.existingAsk?._id).toBe("ask-id-1");
    expect(result.ART001.existingAsk?.askerName).toBe("Иван Иванов");
    expect(result.ART002.existingAsk).toBeNull();
  });

  it("должна обрабатывать случай когда заявок нет", async () => {
    const mockLatestDef: any = {
      _id: "def-id",
      result: {
        ART001: {
          nameukr: "Товар 1",
          quant: 10,
          sharikQuant: 5,
          difQuant: -5,
          defLimit: 30,
          status: "critical",
        },
      },
      total: 1,
      totalCriticalDefs: 1,
      totalLimitDefs: 0,
      createdAt: new Date("2024-01-15T10:00:00.000Z"),
      updatedAt: new Date("2024-01-15T10:00:00.000Z"),
    };

    const mockFind = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      }),
    });
    (Ask as any).find = mockFind;

    const result = await enrichDefsWithAsksUtil(mockLatestDef);

    expect(result).toBeDefined();
    expect(result.ART001).toHaveProperty("existingAsk");
    expect(result.ART001.existingAsk).toBeNull();
  });

  it("должна брать только первую заявку для каждого артикула", async () => {
    const mockLatestDef: any = {
      _id: "def-id",
      result: {
        ART001: {
          nameukr: "Товар 1",
          quant: 10,
          sharikQuant: 5,
          difQuant: -5,
          defLimit: 30,
          status: "critical",
        },
      },
      total: 1,
      totalCriticalDefs: 1,
      totalLimitDefs: 0,
      createdAt: new Date("2024-01-15T10:00:00.000Z"),
      updatedAt: new Date("2024-01-15T10:00:00.000Z"),
    };

    const mockAsks = [
      {
        _id: "ask-id-1" as any,
        artikul: "ART001",
        status: "new",
        createdAt: new Date("2024-01-10T10:00:00.000Z"),
        askerData: {
          fullname: "Иван Иванов",
          _id: "user-id-1" as any,
        },
      },
      {
        _id: "ask-id-2" as any,
        artikul: "ART001",
        status: "new",
        createdAt: new Date("2024-01-12T10:00:00.000Z"),
        askerData: {
          fullname: "Петр Петров",
          _id: "user-id-2" as any,
        },
      },
    ];

    const mockFind = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockAsks),
      }),
    });
    (Ask as any).find = mockFind;

    const result = await enrichDefsWithAsksUtil(mockLatestDef);

    expect(result.ART001.existingAsk?._id).toBe("ask-id-1");
    expect(result.ART001.existingAsk?.askerName).toBe("Иван Иванов");
  });

  it("должна обрабатывать пустые дефициты", async () => {
    const mockLatestDef: any = {
      _id: "def-id",
      result: {},
      total: 0,
      totalCriticalDefs: 0,
      totalLimitDefs: 0,
      createdAt: new Date("2024-01-15T10:00:00.000Z"),
      updatedAt: new Date("2024-01-15T10:00:00.000Z"),
    };

    const mockFind = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      }),
    });
    (Ask as any).find = mockFind;

    const result = await enrichDefsWithAsksUtil(mockLatestDef);

    expect(result).toEqual({});
    expect(mockFind).toHaveBeenCalledWith({
      artikul: { $in: [] },
      status: { $in: ["new"] },
    });
  });
});

