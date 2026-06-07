import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { sortPositionsByPalletSectorUtil } from "../sortPositionsByPalletSectorUtil.js";
const createPosition = (artikul, sector) => {
    const id = new mongoose.Types.ObjectId();
    return {
        artikul,
        palletData: { _id: id, title: `P-${artikul}`, sector, isDef: false },
    };
};
describe("sortPositionsByPalletSectorUtil", () => {
    it("sorts positions by pallet sector ascending", () => {
        const positions = [
            createPosition("C", 5),
            createPosition("A", 1),
            createPosition("B", 3),
        ];
        const sorted = sortPositionsByPalletSectorUtil(positions);
        expect(sorted.map((p) => p.artikul)).toEqual(["A", "B", "C"]);
    });
    it("treats missing sector as 0", () => {
        const positions = [createPosition("B", 2), createPosition("A"), createPosition("C", 1)];
        const sorted = sortPositionsByPalletSectorUtil(positions);
        expect(sorted.map((p) => p.artikul)).toEqual(["A", "C", "B"]);
    });
    it("does not mutate original array", () => {
        const positions = [createPosition("B", 2), createPosition("A", 1)];
        const copy = [...positions];
        sortPositionsByPalletSectorUtil(positions);
        expect(positions).toEqual(copy);
    });
});
