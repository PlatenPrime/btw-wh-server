import { beforeEach, describe, expect, it } from "vitest";
import { createTestArt } from "../../../../../../test/setup.js";
import { getArtsForExportWithKeysUtil } from "../getArtsForExportWithKeysUtil.js";

describe("getArtsForExportWithKeysUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("получает все артикулы для key-based экспорта", async () => {
    await createTestArt({
      artikul: "KEY-001",
      prodName: "Gemar",
      nameukr: "Тест 1",
      namerus: "Тест 1",
      zone: "A1",
      limit: 100,
      marker: "MARK1",
      abc: "A",
    });
    await createTestArt({
      artikul: "KEY-002",
      prodName: "Foli",
      zone: "B2",
    });

    const result = await getArtsForExportWithKeysUtil();

    expect(result).toHaveLength(2);
    expect(result[0].artikul).toBe("KEY-001");
    expect(result[0].prodName).toBe("Gemar");
    expect(result[0].abc).toBe("A");
    expect(result[1].artikul).toBe("KEY-002");
  });

  it("сортирует артикулы по artikul", async () => {
    await createTestArt({ artikul: "KEY-003", zone: "C3" });
    await createTestArt({ artikul: "KEY-001", zone: "A1" });
    await createTestArt({ artikul: "KEY-002", zone: "B2" });

    const result = await getArtsForExportWithKeysUtil();

    expect(result.map((art) => art.artikul)).toEqual([
      "KEY-001",
      "KEY-002",
      "KEY-003",
    ]);
  });

  it("возвращает plain objects через lean()", async () => {
    await createTestArt({ artikul: "KEY-LEAN", zone: "A1" });

    const result = await getArtsForExportWithKeysUtil();

    expect(result[0].constructor.name).toBe("Object");
    expect((result[0] as any).save).toBeUndefined();
  });

  it("возвращает пустой массив когда база пуста", async () => {
    const result = await getArtsForExportWithKeysUtil();
    expect(result).toEqual([]);
  });
});
