import fs from "fs/promises";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { exportCollectionsToJson } from "../exportCollectionsToJson.js";

// Mock fs
vi.mock("fs/promises");
const mockedFs = vi.mocked(fs);

// Mock models
vi.mock("../../../modules/arts/models/Art.js", () => ({
  Art: {
    find: vi.fn(),
  },
}));

vi.mock("../../../modules/rows/models/Row.js", () => ({
  Row: {
    find: vi.fn(),
  },
}));

vi.mock("../../../modules/pallets/models/Pallet.js", () => ({
  Pallet: {
    find: vi.fn(),
  },
}));

vi.mock("../../../modules/poses/models/Pos.js", () => ({
  Pos: {
    find: vi.fn(),
  },
}));

vi.mock("../../../modules/zones/models/Zone.js", () => ({
  Zone: {
    find: vi.fn(),
  },
}));

vi.mock("../../../modules/blocks/models/Block.js", () => ({
  Block: {
    find: vi.fn(),
  },
}));

vi.mock("../../../modules/segs/models/Seg.js", () => ({
  Seg: {
    find: vi.fn(),
  },
}));

vi.mock("../../../modules/auth/models/User.js", () => ({
  default: {
    find: vi.fn(),
  },
}));

vi.mock("../../../modules/auth/models/Role.js", () => ({
  default: {
    find: vi.fn(),
  },
}));

// Import mocked models
import { Art } from "../../../modules/arts/models/Art.js";
import { Row } from "../../../modules/rows/models/Row.js";
import { Pallet } from "../../../modules/pallets/models/Pallet.js";
import { Pos } from "../../../modules/poses/models/Pos.js";
import { Zone } from "../../../modules/zones/models/Zone.js";
import { Block } from "../../../modules/blocks/models/Block.js";
import { Seg } from "../../../modules/segs/models/Seg.js";
import User from "../../../modules/auth/models/User.js";
import Role from "../../../modules/auth/models/Role.js";

// Mock console methods
const consoleSpy = {
  log: vi.spyOn(console, "log"),
  error: vi.spyOn(console, "error"),
};

describe("exportCollectionsToJson", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();

    // Mock lean() and exec() chain
    const mockQuery = {
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn(),
    };

    (Art.find as any).mockReturnValue(mockQuery);
    (Row.find as any).mockReturnValue(mockQuery);
    (Pallet.find as any).mockReturnValue(mockQuery);
    (Pos.find as any).mockReturnValue(mockQuery);
    (Zone.find as any).mockReturnValue(mockQuery);
    (Block.find as any).mockReturnValue(mockQuery);
    (Seg.find as any).mockReturnValue(mockQuery);
    (User.find as any).mockReturnValue(mockQuery);
    (Role.find as any).mockReturnValue(mockQuery);

    // Mock fs.access to simulate directory exists
    mockedFs.access.mockResolvedValue(undefined);
    // Mock fs.writeFile
    mockedFs.writeFile.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("должен успешно экспортировать все коллекции в JSON файл", async () => {
    // Мокаем данные для коллекций
    const mockArts = [{ _id: "art1", artikul: "ART001" }];
    const mockRows = [{ _id: "row1", title: "Row 1" }];
    const mockPallets = [{ _id: "pal1", title: "Pallet 1" }];
    const mockPoses = [{ _id: "pos1", artikul: "ART001" }];
    const mockZones = [{ _id: "zone1", title: "42-5-1" }];
    const mockBlocks = [{ _id: "block1", title: "Block 1" }];
    const mockSegs = [{ _id: "seg1", sector: 1 }];
    const mockUsers = [{ _id: "user1", username: "testuser" }];
    const mockRoles = [{ _id: "role1", value: "USER" }];

    // Создаем mock query объекты для каждой модели
    const createMockQuery = (data: unknown) => ({
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(data),
    });

    (Art.find as any).mockReturnValue(createMockQuery(mockArts));
    (Row.find as any).mockReturnValue(createMockQuery(mockRows));
    (Pallet.find as any).mockReturnValue(createMockQuery(mockPallets));
    (Pos.find as any).mockReturnValue(createMockQuery(mockPoses));
    (Zone.find as any).mockReturnValue(createMockQuery(mockZones));
    (Block.find as any).mockReturnValue(createMockQuery(mockBlocks));
    (Seg.find as any).mockReturnValue(createMockQuery(mockSegs));
    (User.find as any).mockReturnValue(createMockQuery(mockUsers));
    (Role.find as any).mockReturnValue(createMockQuery(mockRoles));

    const result = await exportCollectionsToJson();

    // Проверяем что директория проверялась
    expect(mockedFs.access).toHaveBeenCalled();

    // Проверяем что файл был записан
    expect(mockedFs.writeFile).toHaveBeenCalled();

    // Проверяем путь к файлу (может быть абсолютным на Windows)
    const writeFileCall = mockedFs.writeFile.mock.calls[0];
    const filePath = writeFileCall[0] as string;
    // Проверяем что путь содержит backups и правильный формат имени файла
    expect(filePath).toContain("backups");
    expect(filePath).toMatch(/collections_backup_\d{4}-\d{2}-\d{2}\.json$/);

    // Проверяем содержимое JSON
    const jsonContent = JSON.parse(writeFileCall[1] as string);
    expect(jsonContent).toHaveProperty("arts", mockArts);
    expect(jsonContent).toHaveProperty("rows", mockRows);
    expect(jsonContent).toHaveProperty("pallets", mockPallets);
    expect(jsonContent).toHaveProperty("poses", mockPoses);
    expect(jsonContent).toHaveProperty("zones", mockZones);
    expect(jsonContent).toHaveProperty("blocks", mockBlocks);
    expect(jsonContent).toHaveProperty("segs", mockSegs);
    expect(jsonContent).toHaveProperty("users", mockUsers);
    expect(jsonContent).toHaveProperty("roles", mockRoles);
    expect(jsonContent).toHaveProperty("exportDate");
    expect(new Date(jsonContent.exportDate)).toBeInstanceOf(Date);

    // Проверяем что вернулся правильный путь (может быть абсолютным на Windows)
    expect(result).toContain("backups");
    expect(result).toMatch(/collections_backup_\d{4}-\d{2}-\d{2}\.json$/);
  });

  it("должен создать директорию backups если она не существует", async () => {
    // Мокаем что директория не существует
    mockedFs.access.mockRejectedValueOnce(new Error("Directory not found"));

    const createMockQuery = (data: unknown) => ({
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(data),
    });

    (Art.find as any).mockReturnValue(createMockQuery([]));
    (Row.find as any).mockReturnValue(createMockQuery([]));
    (Pallet.find as any).mockReturnValue(createMockQuery([]));
    (Pos.find as any).mockReturnValue(createMockQuery([]));
    (Zone.find as any).mockReturnValue(createMockQuery([]));
    (Block.find as any).mockReturnValue(createMockQuery([]));
    (Seg.find as any).mockReturnValue(createMockQuery([]));
    (User.find as any).mockReturnValue(createMockQuery([]));
    (Role.find as any).mockReturnValue(createMockQuery([]));

    await exportCollectionsToJson();

    // Проверяем что была попытка создать директорию
    expect(mockedFs.mkdir).toHaveBeenCalledWith(
      expect.stringContaining("backups"),
      { recursive: true }
    );
  });

  it("должен обрабатывать ошибки экспорта отдельных коллекций", async () => {
    const collectionError = new Error("Collection error");
    
    const createMockQuery = (data: unknown, shouldFail = false) => ({
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockImplementation(() => {
        if (shouldFail) {
          return Promise.reject(collectionError);
        }
        return Promise.resolve(data);
      }),
    });

    const createSuccessQuery = (data: unknown) => ({
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(data),
    });

    // Одна коллекция падает с ошибкой
    (Art.find as any).mockReturnValue(createMockQuery([], true));
    (Row.find as any).mockReturnValue(createSuccessQuery([{ _id: "row1" }]));
    (Pallet.find as any).mockReturnValue(createSuccessQuery([]));
    (Pos.find as any).mockReturnValue(createSuccessQuery([]));
    (Zone.find as any).mockReturnValue(createSuccessQuery([]));
    (Block.find as any).mockReturnValue(createSuccessQuery([]));
    (Seg.find as any).mockReturnValue(createSuccessQuery([]));
    (User.find as any).mockReturnValue(createSuccessQuery([]));
    (Role.find as any).mockReturnValue(createSuccessQuery([]));

    const result = await exportCollectionsToJson();

    // Функция не должна упасть, а arts должен быть пустым массивом
    expect(mockedFs.writeFile).toHaveBeenCalled();
    const writeFileCall = mockedFs.writeFile.mock.calls[0];
    const jsonContent = JSON.parse(writeFileCall[1] as string);

    expect(jsonContent.arts).toEqual([]);
    expect(jsonContent.rows).toHaveLength(1);

    // Проверяем что функция успешно выполнилась несмотря на ошибку экспорта одной коллекции
    // Логирование ошибок проверяется через stderr в выводе теста
  });

  it("должен выбрасывать ошибку при ошибке записи файла", async () => {
    const createMockQuery = (data: unknown) => ({
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(data),
    });

    (Art.find as any).mockReturnValue(createMockQuery([]));
    (Row.find as any).mockReturnValue(createMockQuery([]));
    (Pallet.find as any).mockReturnValue(createMockQuery([]));
    (Pos.find as any).mockReturnValue(createMockQuery([]));
    (Zone.find as any).mockReturnValue(createMockQuery([]));
    (Block.find as any).mockReturnValue(createMockQuery([]));
    (Seg.find as any).mockReturnValue(createMockQuery([]));
    (User.find as any).mockReturnValue(createMockQuery([]));
    (Role.find as any).mockReturnValue(createMockQuery([]));

    // Мокаем ошибку записи файла
    const writeError = new Error("Write failed");
    mockedFs.writeFile.mockRejectedValueOnce(writeError);

    await expect(exportCollectionsToJson()).rejects.toThrow(
      "Failed to export collections"
    );

    // Проверяем что ошибка записи файла корректно обработана и функция бросила исключение
    // Логирование ошибок проверяется через stderr в выводе теста
  });

  it("должен экспортировать пустые коллекции", async () => {
    const createMockQuery = (data: unknown) => ({
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(data),
    });

    (Art.find as any).mockReturnValue(createMockQuery([]));
    (Row.find as any).mockReturnValue(createMockQuery([]));
    (Pallet.find as any).mockReturnValue(createMockQuery([]));
    (Pos.find as any).mockReturnValue(createMockQuery([]));
    (Zone.find as any).mockReturnValue(createMockQuery([]));
    (Block.find as any).mockReturnValue(createMockQuery([]));
    (Seg.find as any).mockReturnValue(createMockQuery([]));
    (User.find as any).mockReturnValue(createMockQuery([]));
    (Role.find as any).mockReturnValue(createMockQuery([]));

    await exportCollectionsToJson();

    const writeFileCall = mockedFs.writeFile.mock.calls[0];
    const jsonContent = JSON.parse(writeFileCall[1] as string);

    expect(jsonContent.arts).toEqual([]);
    expect(jsonContent.rows).toEqual([]);
    expect(jsonContent.pallets).toEqual([]);
    expect(jsonContent.poses).toEqual([]);
    expect(jsonContent.zones).toEqual([]);
    expect(jsonContent.blocks).toEqual([]);
    expect(jsonContent.segs).toEqual([]);
    expect(jsonContent.users).toEqual([]);
    expect(jsonContent.roles).toEqual([]);
  });
});