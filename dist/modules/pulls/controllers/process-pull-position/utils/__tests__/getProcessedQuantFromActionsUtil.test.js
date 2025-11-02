import { describe, expect, it } from "vitest";
import { getProcessedQuantFromActionsUtil } from "../getProcessedQuantFromActionsUtil.js";
describe("getProcessedQuantFromActionsUtil", () => {
    it("извлекает обработанное количество из actions", () => {
        const actions = [
            "01.01.2025 12:00 John Doe: знято 5 шт. з паллети Pallet-1",
            "01.01.2025 13:00 Jane Smith: знято 3 шт. з паллети Pallet-2",
            "01.01.2025 14:00 John Doe: знято 2 шт. з паллети Pallet-3",
        ];
        const result = getProcessedQuantFromActionsUtil(actions);
        expect(result).toBe(10); // 5 + 3 + 2
    });
    it("возвращает 0 для пустого массива", () => {
        const actions = [];
        const result = getProcessedQuantFromActionsUtil(actions);
        expect(result).toBe(0);
    });
    it("игнорирует actions без паттерна знято", () => {
        const actions = [
            "01.01.2025 12:00 John Doe: создал запрос",
            "01.01.2025 13:00 Jane Smith: знято 3 шт. з паллети Pallet-2",
        ];
        const result = getProcessedQuantFromActionsUtil(actions);
        expect(result).toBe(3);
    });
    it("обрабатывает большие числа", () => {
        const actions = [
            "01.01.2025 12:00 John Doe: знято 100 шт. з паллети Pallet-1",
            "01.01.2025 13:00 Jane Smith: знято 50 шт. з паллети Pallet-2",
        ];
        const result = getProcessedQuantFromActionsUtil(actions);
        expect(result).toBe(150);
    });
});
