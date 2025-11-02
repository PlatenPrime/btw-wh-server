import { describe, expect, it } from "vitest";
import { getPositionSector } from "../getPositionSector.js";
describe("getPositionSector", () => {
    it("возвращает сектор из позиции", () => {
        const position = {
            palletData: {
                _id: {},
                title: "Pallet 1",
                sector: "5",
                isDef: false,
            },
        };
        const result = getPositionSector(position);
        expect(result).toBe(5);
    });
    it("возвращает 0 если сектор null", () => {
        const position = {
            palletData: {
                _id: {},
                title: "Pallet 1",
                sector: null,
                isDef: false,
            },
        };
        const result = getPositionSector(position);
        expect(result).toBe(0);
    });
    it("возвращает 0 если сектор undefined", () => {
        const position = {
            palletData: {
                _id: {},
                title: "Pallet 1",
                isDef: false,
            },
        };
        const result = getPositionSector(position);
        expect(result).toBe(0);
    });
});
