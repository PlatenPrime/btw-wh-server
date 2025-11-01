import { beforeEach, describe, expect, it } from "vitest";
import { Zone } from "../../../../models/Zone.js";
import { getZonesForExportUtil } from "../getZonesForExportUtil.js";

describe("getZonesForExportUtil", () => {
  it("возвращает все зоны отсортированные по sector и title", async () => {
    // Создаём тестовые данные
    await Zone.insertMany([
      { title: "2-1", bar: 20201, sector: 1 },
      { title: "1-2", bar: 10102, sector: 0 },
      { title: "1-1", bar: 10101, sector: 0 },
      { title: "2-2", bar: 20202, sector: 1 },
    ]);

    const result = await getZonesForExportUtil();

    expect(result).toHaveLength(4);
    expect(result[0].title).toBe("1-1");
    expect(result[1].title).toBe("1-2");
    expect(result[2].title).toBe("2-1");
    expect(result[3].title).toBe("2-2");
  });

  it("возвращает пустой массив если зон нет", async () => {
    const result = await getZonesForExportUtil();

    expect(result).toHaveLength(0);
  });
});

