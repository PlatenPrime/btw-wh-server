import { describe, expect, it } from "vitest";
import { getCreateAskMessageUtil } from "../getCreateAskMesUtil.js";
describe("getCreateAskMessageUtil", () => {
    it("формирует сообщение с полями пользователя и заявки", () => {
        const message = getCreateAskMessageUtil({
            askerData: {
                _id: "507f1f77bcf86cd799439011",
                fullname: "Test User",
            },
            artikul: "ART-001",
            nameukr: "Папір А4",
            quant: 2,
            com: "примітка",
        });
        expect(message).toContain("🆕 Новий запит");
        expect(message).toContain("Test User");
        expect(message).toContain("ART-001");
        expect(message).toContain("Папір А4");
        expect(message).toContain("2");
        expect(message).toContain("примітка");
    });
    it("подставляет дефолтные тире для пустых значений", () => {
        const message = getCreateAskMessageUtil({
            askerData: {
                _id: "507f1f77bcf86cd799439011",
                fullname: "Test User",
            },
            artikul: "ART-001",
            nameukr: "",
            quant: 0,
            com: "",
        });
        expect(message).toContain("📝 —");
        expect(message).toContain("🔢 —");
        expect(message).toContain("💬 —");
    });
});
