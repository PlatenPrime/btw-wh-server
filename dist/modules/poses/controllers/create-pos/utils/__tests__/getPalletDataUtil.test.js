import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { getPalletDataUtil } from "../getPalletDataUtil.js";
describe("getPalletDataUtil", () => {
    it("формирует palletData subdocument из объекта паллета", () => {
        const pallet = {
            _id: new mongoose.Types.ObjectId(),
            title: "Test Pallet",
            sector: "A",
            isDef: false,
        };
        const result = getPalletDataUtil(pallet);
        expect(result).toEqual({
            _id: pallet._id,
            title: "Test Pallet",
            sector: "A",
            isDef: false,
        });
    });
    it("обрабатывает паллет без sector", () => {
        const pallet = {
            _id: new mongoose.Types.ObjectId(),
            title: "Test Pallet",
            isDef: true,
        };
        const result = getPalletDataUtil(pallet);
        expect(result.sector).toBeUndefined();
        expect(result.isDef).toBe(true);
    });
});
