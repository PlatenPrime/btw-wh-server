import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import { mapPalletToShortDto } from "../mapPalletToShortDto.js";
describe("mapPalletToShortDto", () => {
    it("maps pallet fields to short DTO", () => {
        const palletId = new Types.ObjectId();
        const palgrId = new Types.ObjectId();
        const dto = mapPalletToShortDto({
            _id: palletId,
            title: "1-1",
            sector: 101,
            poses: [new Types.ObjectId()],
            isDef: true,
            palgr: { id: palgrId, title: "Group A" },
        });
        expect(dto).toEqual({
            id: palletId.toString(),
            title: "1-1",
            sector: 101,
            isDef: true,
            isEmpty: false,
            palgrId: palgrId.toString(),
            palgrTitle: "Group A",
        });
    });
    it("marks empty pallet when poses array is empty", () => {
        const dto = mapPalletToShortDto({
            _id: new Types.ObjectId(),
            title: "2-1",
            sector: 0,
            poses: [],
            isDef: false,
        });
        expect(dto.isEmpty).toBe(true);
        expect(dto.palgrId).toBeUndefined();
        expect(dto.palgrTitle).toBeUndefined();
    });
});
