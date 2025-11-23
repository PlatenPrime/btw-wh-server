import { beforeEach, describe, expect, it } from "vitest";
import { createTestPos } from "../../../../../../test/setup.js";
import { getPosesQuantByArtikulUtil } from "../getPosesQuantByArtikulUtil.js";
describe("getPosesQuantByArtikulUtil", () => {
    beforeEach(async () => {
        // collections cleared in global setup
    });
    it("получает суммы quant по artikul", async () => {
        await createTestPos({
            artikul: "ART-001",
            quant: 10,
            sklad: "pogrebi",
        });
        await createTestPos({
            artikul: "ART-002",
            quant: 20,
            sklad: "pogrebi",
        });
        const result = await getPosesQuantByArtikulUtil();
        expect(result).toBeInstanceOf(Map);
        expect(result.size).toBe(2);
        expect(result.get("ART-001")).toBe(10);
        expect(result.get("ART-002")).toBe(20);
    });
    it("фильтрует по sklad === 'pogrebi' - учитываются только позиции с нужным складом", async () => {
        await createTestPos({
            artikul: "ART-001",
            quant: 10,
            sklad: "pogrebi",
        });
        await createTestPos({
            artikul: "ART-002",
            quant: 20,
            sklad: "merezhi", // другой склад
        });
        await createTestPos({
            artikul: "ART-003",
            quant: 30,
            sklad: "pogrebi",
        });
        const result = await getPosesQuantByArtikulUtil();
        expect(result.size).toBe(2);
        expect(result.get("ART-001")).toBe(10);
        expect(result.get("ART-003")).toBe(30);
        expect(result.get("ART-002")).toBeUndefined(); // не должно быть в результате
    });
    it("возвращает Map<string, number>", async () => {
        await createTestPos({
            artikul: "ART-001",
            quant: 10,
            sklad: "pogrebi",
        });
        const result = await getPosesQuantByArtikulUtil();
        expect(result).toBeInstanceOf(Map);
        expect(typeof result.get("ART-001")).toBe("number");
    });
    it("суммирует quant для одного artikul", async () => {
        await createTestPos({
            artikul: "ART-001",
            quant: 10,
            sklad: "pogrebi",
        });
        await createTestPos({
            artikul: "ART-001",
            quant: 15,
            sklad: "pogrebi",
        });
        await createTestPos({
            artikul: "ART-001",
            quant: 25,
            sklad: "pogrebi",
        });
        const result = await getPosesQuantByArtikulUtil();
        expect(result.size).toBe(1);
        expect(result.get("ART-001")).toBe(50); // 10 + 15 + 25
    });
    it("возвращает пустой Map когда база данных пуста", async () => {
        const result = await getPosesQuantByArtikulUtil();
        expect(result).toBeInstanceOf(Map);
        expect(result.size).toBe(0);
    });
    it("игнорирует позиции с другим sklad", async () => {
        await createTestPos({
            artikul: "ART-001",
            quant: 10,
            sklad: "merezhi",
        });
        await createTestPos({
            artikul: "ART-002",
            quant: 20,
            sklad: "other",
        });
        await createTestPos({
            artikul: "ART-003",
            quant: 30,
            sklad: "pogrebi",
        });
        const result = await getPosesQuantByArtikulUtil();
        expect(result.size).toBe(1);
        expect(result.get("ART-003")).toBe(30);
        expect(result.get("ART-001")).toBeUndefined();
        expect(result.get("ART-002")).toBeUndefined();
    });
    it("обрабатывает несколько artikul с разными суммами", async () => {
        // ART-001: 10 + 20 = 30
        await createTestPos({
            artikul: "ART-001",
            quant: 10,
            sklad: "pogrebi",
        });
        await createTestPos({
            artikul: "ART-001",
            quant: 20,
            sklad: "pogrebi",
        });
        // ART-002: 5
        await createTestPos({
            artikul: "ART-002",
            quant: 5,
            sklad: "pogrebi",
        });
        // ART-003: 15 + 25 + 10 = 50
        await createTestPos({
            artikul: "ART-003",
            quant: 15,
            sklad: "pogrebi",
        });
        await createTestPos({
            artikul: "ART-003",
            quant: 25,
            sklad: "pogrebi",
        });
        await createTestPos({
            artikul: "ART-003",
            quant: 10,
            sklad: "pogrebi",
        });
        const result = await getPosesQuantByArtikulUtil();
        expect(result.size).toBe(3);
        expect(result.get("ART-001")).toBe(30);
        expect(result.get("ART-002")).toBe(5);
        expect(result.get("ART-003")).toBe(50);
    });
    it("обрабатывает позиции с quant равным 0", async () => {
        await createTestPos({
            artikul: "ART-001",
            quant: 0,
            sklad: "pogrebi",
        });
        await createTestPos({
            artikul: "ART-001",
            quant: 10,
            sklad: "pogrebi",
        });
        const result = await getPosesQuantByArtikulUtil();
        expect(result.get("ART-001")).toBe(10); // 0 + 10
    });
    it("обрабатывает позиции без sklad (undefined)", async () => {
        await createTestPos({
            artikul: "ART-001",
            quant: 10,
            sklad: "pogrebi",
        });
        await createTestPos({
            artikul: "ART-002",
            quant: 20,
            // sklad не указан
        });
        const result = await getPosesQuantByArtikulUtil();
        expect(result.size).toBe(1);
        expect(result.get("ART-001")).toBe(10);
        expect(result.get("ART-002")).toBeUndefined();
    });
});
