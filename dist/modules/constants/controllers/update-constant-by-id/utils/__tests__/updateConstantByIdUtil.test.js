import { beforeEach, describe, expect, it } from "vitest";
import { Constant } from "../../../../models/Constant.js";
import { updateConstantByIdUtil } from "../updateConstantByIdUtil.js";
describe("updateConstantByIdUtil", () => {
    beforeEach(async () => {
        await Constant.deleteMany({});
    });
    it("returns null when constant not found", async () => {
        const result = await updateConstantByIdUtil({
            id: "000000000000000000000000",
            title: "New",
        });
        expect(result).toBeNull();
    });
    it("updates only provided fields and returns updated document", async () => {
        const constant = await Constant.create({
            name: "old",
            title: "Old Title",
            data: { a: "1" },
        });
        const result = await updateConstantByIdUtil({
            id: constant._id.toString(),
            title: "New Title",
        });
        expect(result?.title).toBe("New Title");
        expect(result?.name).toBe("old");
        expect(result?.data).toEqual({ a: "1" });
        const found = await Constant.findById(constant._id);
        expect(found?.title).toBe("New Title");
    });
    it("when no fields provided returns current document", async () => {
        const constant = await Constant.create({
            name: "x",
            title: "X",
            data: {},
        });
        const result = await updateConstantByIdUtil({ id: constant._id.toString() });
        expect(result?.name).toBe("x");
        expect(result?.title).toBe("X");
    });
});
