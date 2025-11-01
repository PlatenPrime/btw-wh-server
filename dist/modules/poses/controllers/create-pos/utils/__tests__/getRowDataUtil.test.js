import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { getRowDataUtil } from "../getRowDataUtil.js";
describe("getRowDataUtil", () => {
    it("формирует rowData subdocument из объекта ряда", () => {
        const row = {
            _id: new mongoose.Types.ObjectId(),
            title: "Test Row",
        };
        const result = getRowDataUtil(row);
        expect(result).toEqual({
            _id: row._id,
            title: "Test Row",
        });
    });
});
