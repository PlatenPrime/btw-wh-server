import { describe, expect, it } from "vitest";
import { DEFICIT_REPORT_CHUNK_SIZE } from "../../constants/deficitReportCron.js";
import { formatDeficitTelegramErrorMessage, formatDeficitTelegramMessages, } from "../formatDeficitTelegramMessages.js";
function deficitItem(status, difQuant) {
    return {
        nameukr: "Товар",
        quant: 10,
        sharikQuant: status === "critical" ? 5 : 15,
        difQuant,
        defLimit: 20,
        status,
    };
}
function numberedResult(status, count) {
    const result = {};
    for (let i = 1; i <= count; i += 1) {
        result[`ART${String(i).padStart(3, "0")}`] = deficitItem(status, -i);
    }
    return result;
}
describe("formatDeficitTelegramMessages", () => {
    it("returns empty-state message when there are no deficits", () => {
        expect(formatDeficitTelegramMessages({})).toEqual([
            "🎉 Відмінно!\nДефіцитів не знайдено\nВсі артикули в нормі",
        ]);
    });
    it("sends only limited chunks then summary", () => {
        const messages = formatDeficitTelegramMessages({
            A1: deficitItem("limited", 3),
            A2: deficitItem("limited", 1),
        });
        expect(messages).toHaveLength(2);
        expect(messages[0]).toBe("🟡 Дефіцити в ліміті (1-2 з 2):\nA1: 3\nA2: 1");
        expect(messages[1]).toBe("✅ Розрахунок дефіцитів завершено\n" +
            "• Всього дефіцитів: 2\n" +
            "• Критичних: 0\n" +
            "• В ліміті: 2");
    });
    it("sends only critical chunks then summary", () => {
        const messages = formatDeficitTelegramMessages({
            C1: deficitItem("critical", -4),
        });
        expect(messages).toHaveLength(2);
        expect(messages[0]).toBe("🔴 Критичні дефіцити (1-1 з 1):\nC1: -4");
        expect(messages[1]).toContain("• Критичних: 1");
        expect(messages[1]).toContain("• В ліміті: 0");
    });
    it("sends limited chunks before critical chunks then summary", () => {
        const messages = formatDeficitTelegramMessages({
            C1: deficitItem("critical", -2),
            L1: deficitItem("limited", 4),
        });
        expect(messages).toHaveLength(3);
        expect(messages[0]).toContain("Дефіцити в ліміті");
        expect(messages[0]).toContain("L1: 4");
        expect(messages[1]).toContain("Критичні дефіцити");
        expect(messages[1]).toContain("C1: -2");
        expect(messages[2]).toBe("✅ Розрахунок дефіцитів завершено\n" +
            "• Всього дефіцитів: 2\n" +
            "• Критичних: 1\n" +
            "• В ліміті: 1");
    });
    it("splits a category into chunks of DEFICIT_REPORT_CHUNK_SIZE", () => {
        const count = DEFICIT_REPORT_CHUNK_SIZE + 1;
        const messages = formatDeficitTelegramMessages(numberedResult("limited", count));
        expect(messages).toHaveLength(3);
        expect(messages[0]).toContain(`1-${DEFICIT_REPORT_CHUNK_SIZE} з ${count}`);
        expect(messages[0]).toContain("ART001: -1");
        expect(messages[0]).toContain("ART020: -20");
        expect(messages[0]).not.toContain("ART021");
        expect(messages[1]).toContain(`${count}-${count} з ${count}`);
        expect(messages[1]).toContain("ART021: -21");
        expect(messages[2]).toContain(`• Всього дефіцитів: ${count}`);
    });
    it("treats missing difQuant as 0", () => {
        const item = deficitItem("limited", 0);
        delete item.difQuant;
        const messages = formatDeficitTelegramMessages({
            Z1: item,
        });
        expect(messages[0]).toContain("Z1: 0");
    });
});
describe("formatDeficitTelegramErrorMessage", () => {
    it("formats Error.message as plain text", () => {
        expect(formatDeficitTelegramErrorMessage(new Error("calc failed"))).toBe("❌ Помилка при розрахунку дефіцитів\n\nПомилка: calc failed");
    });
    it("uses fallback text for non-Error values", () => {
        expect(formatDeficitTelegramErrorMessage("boom")).toBe("❌ Помилка при розрахунку дефіцитів\n\nПомилка: Невідома помилка");
    });
});
