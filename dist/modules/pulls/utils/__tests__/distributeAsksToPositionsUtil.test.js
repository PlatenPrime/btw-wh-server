import { describe, expect, it } from "vitest";
import { distributeAsksToPositionsUtil } from "../distributeAsksToPositionsUtil.js";
import { Types } from "mongoose";
const buildAsk = (overrides) => ({
    _id: new Types.ObjectId(),
    artikul: "ART-1",
    asker: new Types.ObjectId(),
    askerData: {
        _id: new Types.ObjectId(),
        fullname: "User",
        telegram: "@user",
        photo: "",
    },
    status: "new",
    actions: [],
    pullQuant: 0,
    pullBox: 0,
    events: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});
const buildPosition = (overrides) => ({
    _id: new Types.ObjectId(),
    pallet: new Types.ObjectId(),
    row: new Types.ObjectId(),
    palletData: {
        _id: new Types.ObjectId(),
        title: "Pallet A",
        sector: "1",
        isDef: false,
    },
    rowData: {
        _id: new Types.ObjectId(),
        title: "Row 1",
    },
    palletTitle: "Pallet A",
    rowTitle: "Row 1",
    artikul: "ART-1",
    quant: 50,
    boxes: 5,
    comment: "",
    ...overrides,
});
describe("distributeAsksToPositionsUtil", () => {
    it("распределяет остаток по позициям и учитывает уже снятое количество", () => {
        const ask = buildAsk({ quant: 10, pullQuant: 3 });
        const positions = [
            buildPosition({
                quant: 5,
                palletData: {
                    _id: new Types.ObjectId(),
                    title: "Pallet A",
                    sector: "1",
                    isDef: false,
                },
            }),
            buildPosition({
                quant: 20,
                palletData: {
                    _id: new Types.ObjectId(),
                    title: "Pallet B",
                    sector: "2",
                    isDef: false,
                },
                palletTitle: "Pallet B",
            }),
        ];
        const result = distributeAsksToPositionsUtil([ask], positions);
        expect(result).toHaveLength(2);
        expect(result[0].plannedQuant).toBe(5);
        expect(result[1].plannedQuant).toBe(2);
        expect(result[0].totalRequestedQuant).toBe(10);
        expect(result[0].alreadyPulledQuant).toBe(3);
    });
    it("создаёт записи с plannedQuant=null для заявок без указанного количества", () => {
        const ask = buildAsk({ quant: undefined });
        const positions = [buildPosition({})];
        const result = distributeAsksToPositionsUtil([ask], positions);
        expect(result).toHaveLength(1);
        expect(result[0].plannedQuant).toBeNull();
        expect(result[0].totalRequestedQuant).toBeNull();
    });
    it("возвращает пустой список, если нет доступных позиций", () => {
        const ask = buildAsk({ quant: 5 });
        const result = distributeAsksToPositionsUtil([ask], []);
        expect(result).toEqual([]);
    });
});
