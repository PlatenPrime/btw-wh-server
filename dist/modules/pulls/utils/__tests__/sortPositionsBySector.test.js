import { describe, expect, it } from "vitest";
import { sortPositionsBySector } from "../sortPositionsBySector.js";
describe("sortPositionsBySector", () => {
    it("сортирует позиции по сектору по возрастанию", () => {
        const positions = [
            {
                palletData: {
                    _id: {},
                    title: "Pallet 3",
                    sector: "10",
                    isDef: false,
                },
            },
            {
                palletData: {
                    _id: {},
                    title: "Pallet 1",
                    sector: "5",
                    isDef: false,
                },
            },
            {
                palletData: {
                    _id: {},
                    title: "Pallet 2",
                    sector: "7",
                    isDef: false,
                },
            },
        ];
        const result = sortPositionsBySector(positions);
        expect(result[0].palletData.sector).toBe("5");
        expect(result[1].palletData.sector).toBe("7");
        expect(result[2].palletData.sector).toBe("10");
    });
    it("обрабатывает позиции без сектора (считает как 0)", () => {
        const positions = [
            {
                palletData: {
                    _id: {},
                    title: "Pallet 2",
                    sector: "5",
                    isDef: false,
                },
            },
            {
                palletData: {
                    _id: {},
                    title: "Pallet 1",
                    isDef: false,
                },
            },
        ];
        const result = sortPositionsBySector(positions);
        expect(result[0].palletData.sector).toBeUndefined();
        expect(result[1].palletData.sector).toBe("5");
    });
});
