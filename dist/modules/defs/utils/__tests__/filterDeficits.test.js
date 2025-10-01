import { describe, expect, it } from "vitest";
import { filterDeficits } from "../filterDeficits.js";
describe("filterDeficits", () => {
    it("должна включать критические дефициты (sharikQuant <= quant)", () => {
        const mockData = {
            ART001: {
                nameukr: "Товар 1",
                quant: 10,
                boxes: 2,
                sharikQuant: 5, // sharikQuant <= quant (критический дефицит)
                difQuant: -5,
                limit: 20, // artLimit
            },
            ART002: {
                nameukr: "Товар 2",
                quant: 10,
                boxes: 2,
                sharikQuant: 10, // sharikQuant = quant (граничный случай критического дефицита)
                difQuant: 0,
                limit: 20, // artLimit
            },
        };
        const result = filterDeficits(mockData);
        expect(result).toHaveProperty("ART001");
        expect(result).toHaveProperty("ART002");
        expect(Object.keys(result)).toHaveLength(2);
        // Проверяем, что поле defLimit рассчитано правильно (quant + artLimit)
        expect(result["ART001"].defLimit).toBe(30); // 10 + 20
        expect(result["ART002"].defLimit).toBe(30); // 10 + 20
        // Проверяем, что статус установлен правильно для критических дефицитов
        expect(result["ART001"].status).toBe("critical");
        expect(result["ART002"].status).toBe("critical");
    });
    it("должна включать лимитированные дефициты (sharikQuant <= defLimit и sharikQuant > quant)", () => {
        const mockData = {
            ART001: {
                nameukr: "Товар 1",
                quant: 10,
                boxes: 1,
                sharikQuant: 25, // sharikQuant <= defLimit (30) и > quant (10) - лимитированный дефицит
                difQuant: 15,
                limit: 20, // artLimit, defLimit = 10 + 20 = 30
            },
            ART002: {
                nameukr: "Товар 2",
                quant: 5,
                boxes: 1,
                sharikQuant: 15, // sharikQuant <= defLimit (20) и > quant (5) - лимитированный дефицит
                difQuant: 10,
                limit: 15, // artLimit, defLimit = 5 + 15 = 20
            },
        };
        const result = filterDeficits(mockData);
        expect(result).toHaveProperty("ART001");
        expect(result).toHaveProperty("ART002");
        expect(Object.keys(result)).toHaveLength(2);
        // Проверяем, что поле defLimit рассчитано правильно
        expect(result["ART001"].defLimit).toBe(30); // 10 + 20
        expect(result["ART002"].defLimit).toBe(20); // 5 + 15
        // Проверяем, что статус установлен правильно для лимитированных дефицитов
        expect(result["ART001"].status).toBe("limited");
        expect(result["ART002"].status).toBe("limited");
    });
    it("должна исключать артикулы без дефицитов (sharikQuant > defLimit)", () => {
        const mockData = {
            ART001: {
                nameukr: "Товар 1",
                quant: 10,
                boxes: 3,
                sharikQuant: 35, // sharikQuant > defLimit (30) - нет дефицита
                difQuant: 25,
                limit: 20, // artLimit, defLimit = 10 + 20 = 30
            },
            ART002: {
                nameukr: "Товар 2",
                quant: 20,
                boxes: 4,
                sharikQuant: 25, // sharikQuant > defLimit (20) - нет дефицита
                difQuant: 5,
                limit: undefined, // limit не определен, defLimit = 20 + 0 = 20
            },
        };
        const result = filterDeficits(mockData);
        expect(result).not.toHaveProperty("ART001");
        expect(result).not.toHaveProperty("ART002");
        expect(Object.keys(result)).toHaveLength(0);
    });
    it("должна обрабатывать смешанные случаи", () => {
        const mockData = {
            ART001: {
                nameukr: "Товар 1",
                quant: 10,
                boxes: 2,
                sharikQuant: 5, // критический дефицит (sharikQuant <= quant)
                difQuant: -5,
                limit: 20,
            },
            ART002: {
                nameukr: "Товар 2",
                quant: 10,
                boxes: 1,
                sharikQuant: 25, // лимитированный дефицит (sharikQuant <= defLimit и > quant)
                difQuant: 15,
                limit: 20, // defLimit = 10 + 20 = 30
            },
            ART003: {
                nameukr: "Товар 3",
                quant: 15,
                boxes: 3,
                sharikQuant: 35, // нет дефицита (sharikQuant > defLimit)
                difQuant: 20,
                limit: 10, // defLimit = 15 + 10 = 25
            },
        };
        const result = filterDeficits(mockData);
        expect(result).toHaveProperty("ART001");
        expect(result).toHaveProperty("ART002");
        expect(result).not.toHaveProperty("ART003");
        expect(Object.keys(result)).toHaveLength(2);
        // Проверяем, что поле defLimit рассчитано правильно
        expect(result["ART001"].defLimit).toBe(30); // 10 + 20
        expect(result["ART002"].defLimit).toBe(30); // 10 + 20
        // Проверяем, что статус установлен правильно для смешанных случаев
        expect(result["ART001"].status).toBe("critical");
        expect(result["ART002"].status).toBe("limited");
    });
    it("должна обрабатывать пустой объект", () => {
        const result = filterDeficits({});
        expect(result).toEqual({});
        expect(Object.keys(result)).toHaveLength(0);
    });
    it("должна правильно обрабатывать граничные случаи", () => {
        const mockData = {
            ART001: {
                nameukr: "Товар 1",
                quant: 10,
                boxes: 1,
                sharikQuant: 30, // sharikQuant = defLimit (граничный случай лимитированного дефицита)
                difQuant: 20,
                limit: 20, // defLimit = 10 + 20 = 30
            },
            ART002: {
                nameukr: "Товар 2",
                quant: 10,
                boxes: 1,
                sharikQuant: 31, // sharikQuant > defLimit (граничный случай без дефицита)
                difQuant: 21,
                limit: 20, // defLimit = 10 + 20 = 30
            },
        };
        const result = filterDeficits(mockData);
        expect(result).toHaveProperty("ART001");
        expect(result).not.toHaveProperty("ART002");
        expect(Object.keys(result)).toHaveLength(1);
        // Проверяем, что поле defLimit рассчитано правильно
        expect(result["ART001"].defLimit).toBe(30); // 10 + 20
        // Проверяем, что статус установлен правильно для граничного случая
        expect(result["ART001"].status).toBe("limited");
    });
});
