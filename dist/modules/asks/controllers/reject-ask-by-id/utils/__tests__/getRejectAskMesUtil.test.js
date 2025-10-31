import { describe, expect, it } from "vitest";
import { getRejectAskMesUtil } from "../getRejectAskMesUtil.js";
describe("getRejectAskMesUtil", () => {
    it("формирует корректное сообщение для автора о отклонении", () => {
        const msg = getRejectAskMesUtil({
            solverName: "Solver",
            ask: {
                artikul: "ART-9",
                nameukr: "Найменування",
                quant: 1,
            },
        });
        expect(msg).toContain("❌ Ваш запит відхилено");
        expect(msg).toContain("ART-9");
        expect(msg).toContain("Найменування");
        expect(msg).toContain("1");
        expect(msg).toContain("Відхилив: Solver");
    });
});
