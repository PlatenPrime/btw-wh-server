import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import { checkAskCompletionUtil } from "../checkAskCompletionUtil.js";
describe("checkAskCompletionUtil", () => {
    it("возвращает true если обработанное количество >= запрошенного", () => {
        const ask = {
            _id: new Types.ObjectId(),
            artikul: "ART-001",
            quant: 10,
            status: "new",
            // actions уже включают новый action с количеством 2 (добавлен в контроллере перед вызовом этой функции)
            actions: [
                "01.01.2025 12:00 John Doe: знято 5 шт. з паллети Pallet-1",
                "01.01.2025 13:00 Jane Smith: знято 3 шт. з паллети Pallet-2",
                "01.01.2025 14:00 Solver: знято 2 шт. з паллети Pallet-3",
            ],
            asker: new Types.ObjectId(),
            askerData: {},
            solver: new Types.ObjectId(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        // 5 + 3 + 2 = 10, что равно quant (все действия уже в actions)
        const result = checkAskCompletionUtil(ask, 2, 0);
        expect(result).toBe(true);
    });
    it("возвращает false если обработанное количество < запрошенного", () => {
        const ask = {
            _id: new Types.ObjectId(),
            artikul: "ART-001",
            quant: 10,
            status: "new",
            // actions уже включают новый action, но сумма всё ещё меньше quant
            actions: [
                "01.01.2025 12:00 John Doe: знято 5 шт. з паллети Pallet-1",
                "01.01.2025 13:00 Solver: знято 2 шт. з паллети Pallet-2",
            ],
            asker: new Types.ObjectId(),
            askerData: {},
            solver: new Types.ObjectId(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        // 5 + 2 = 7 < 10 (все действия уже в actions)
        const result = checkAskCompletionUtil(ask, 2, 0);
        expect(result).toBe(false);
    });
    it("возвращает true если ask не имеет quant и был снят товар", () => {
        const ask = {
            _id: new Types.ObjectId(),
            artikul: "ART-001",
            quant: undefined,
            status: "new",
            actions: [],
            asker: new Types.ObjectId(),
            askerData: {},
            solver: new Types.ObjectId(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = checkAskCompletionUtil(ask, 5, 0);
        expect(result).toBe(true);
    });
    it("возвращает false если ask не имеет quant и товар не был снят", () => {
        const ask = {
            _id: new Types.ObjectId(),
            artikul: "ART-001",
            quant: undefined,
            status: "new",
            actions: [],
            asker: new Types.ObjectId(),
            askerData: {},
            solver: new Types.ObjectId(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = checkAskCompletionUtil(ask, 0, 0);
        expect(result).toBe(false);
    });
    it("возвращает true если ask не имеет quant и были сняты коробки", () => {
        const ask = {
            _id: new Types.ObjectId(),
            artikul: "ART-001",
            quant: undefined,
            status: "new",
            actions: [],
            asker: new Types.ObjectId(),
            askerData: {},
            solver: new Types.ObjectId(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = checkAskCompletionUtil(ask, 0, 2);
        expect(result).toBe(true);
    });
    it("возвращает true если quant <= 0 и был снят товар", () => {
        const ask = {
            _id: new Types.ObjectId(),
            artikul: "ART-001",
            quant: 0,
            status: "new",
            actions: [],
            asker: new Types.ObjectId(),
            askerData: {},
            solver: new Types.ObjectId(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = checkAskCompletionUtil(ask, 5, 0);
        expect(result).toBe(true);
    });
    it("возвращает false если quant <= 0 и товар не был снят", () => {
        const ask = {
            _id: new Types.ObjectId(),
            artikul: "ART-001",
            quant: 0,
            status: "new",
            actions: [],
            asker: new Types.ObjectId(),
            askerData: {},
            solver: new Types.ObjectId(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = checkAskCompletionUtil(ask, 0, 0);
        expect(result).toBe(false);
    });
});
