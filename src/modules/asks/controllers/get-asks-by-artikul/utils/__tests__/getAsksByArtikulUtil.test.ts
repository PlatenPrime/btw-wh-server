import { describe, expect, it } from "vitest";
import { getAsksByArtikulUtil } from "../getAsksByArtikulUtil.js";
import { createTestAsk } from "../../../../../../test/setup.js";

describe("getAsksByArtikulUtil", () => {
  it("возвращает заявки только с указанным артикулом", async () => {
    await createTestAsk({ artikul: "ART-A" });
    await createTestAsk({ artikul: "ART-B" });
    await createTestAsk({ artikul: "ART-A" });

    const list = await getAsksByArtikulUtil("ART-A");

    expect(list.length).toBe(2);
    expect(list.every((ask) => ask.artikul === "ART-A")).toBe(true);
  });

  it("возвращает заявки отсортированные по дате создания (новые сначала)", async () => {
    const date1 = new Date("2025-01-01T10:00:00");
    const date2 = new Date("2025-01-02T10:00:00");
    const date3 = new Date("2025-01-03T10:00:00");

    await createTestAsk({ artikul: "ART-SORT", createdAt: date1 });
    await createTestAsk({ artikul: "ART-SORT", createdAt: date3 });
    await createTestAsk({ artikul: "ART-SORT", createdAt: date2 });

    const list = await getAsksByArtikulUtil("ART-SORT");

    expect(list.length).toBe(3);
    expect(list[0].createdAt.getTime()).toBe(date3.getTime());
    expect(list[1].createdAt.getTime()).toBe(date2.getTime());
    expect(list[2].createdAt.getTime()).toBe(date1.getTime());
  });

  it("возвращает пустой массив при отсутствии asks с таким артикулом", async () => {
    await createTestAsk({ artikul: "ART-OTHER" });

    const list = await getAsksByArtikulUtil("ART-NOT-EXISTS");

    expect(list.length).toBe(0);
    expect(list).toEqual([]);
  });
});
