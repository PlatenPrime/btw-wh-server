import { describe, expect, it } from "vitest";
import { getAsksByDateUtil } from "../getAsksByDateUtil.js";
import { createTestAsk } from "../../../../../../test/setup.js";
describe("getAsksByDateUtil", () => {
    it("возвращает заявки только выбранного дня", async () => {
        const base = new Date("2025-01-02T00:00:00");
        const dayStart = new Date(base);
        dayStart.setHours(1, 0, 0, 0);
        const dayLate = new Date(base);
        dayLate.setHours(22, 59, 59, 999);
        const nextDay = new Date(base);
        nextDay.setDate(base.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);
        await createTestAsk({ artikul: "ART-A", createdAt: dayStart });
        await createTestAsk({ artikul: "ART-B", createdAt: dayLate });
        await createTestAsk({ artikul: "ART-C", createdAt: nextDay });
        const list = await getAsksByDateUtil("2025-01-02");
        expect(list.length).toBe(2);
        expect(list.map((a) => a.artikul).sort()).toEqual(["ART-A", "ART-B"].sort());
    });
});
