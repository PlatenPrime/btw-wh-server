import { describe, expect, it } from "vitest";
import { getCreateKaskMessageUtil } from "../getCreateKaskMesUtil.js";
describe("getCreateKaskMessageUtil", () => {
    it("формирует сообщение со всеми полями", () => {
        const message = getCreateKaskMessageUtil({
            artikul: "1234-5678",
            nameukr: "Кулька червона",
            quant: 10,
            zone: "42-5-1",
            com: "До каси 3",
        });
        expect(message).toContain("🆕 Новий запит до каси");
        expect(message).toContain("1234-5678");
        expect(message).toContain("Кулька червона");
        expect(message).toContain("10 шт");
        expect(message).toContain("42-5-1");
        expect(message).toContain("До каси 3");
        expect(message).toContain("https://sharik.ua/images/elements_big/1234-5678_m1.jpg");
    });
    it("подставляет прочерк для отсутствующего quant", () => {
        const message = getCreateKaskMessageUtil({
            artikul: "1234-5678",
            nameukr: "Товар",
            zone: "A1",
        });
        expect(message).toContain("🔢 —");
    });
    it("подставляет прочерк для пустого com", () => {
        const message = getCreateKaskMessageUtil({
            artikul: "1234-5678",
            nameukr: "Товар",
            zone: "A1",
            com: "",
        });
        expect(message).toContain("💬 —");
    });
    it("кодирует artikul в URL изображения", () => {
        const message = getCreateKaskMessageUtil({
            artikul: "art/with space",
            nameukr: "Товар",
            zone: "A1",
        });
        expect(message).toContain("https://sharik.ua/images/elements_big/art%2Fwith%20space_m1.jpg");
    });
});
