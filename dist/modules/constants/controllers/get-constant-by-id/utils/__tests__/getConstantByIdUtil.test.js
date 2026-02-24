import { beforeEach, describe, expect, it } from "vitest";
import { Constant } from "../../../../models/Constant.js";
import { getConstantByIdUtil } from "../getConstantByIdUtil.js";
describe("getConstantByIdUtil", () => {
    beforeEach(async () => {
        await Constant.deleteMany({});
    });
    it("returns null for non-existent id", async () => {
        const result = await getConstantByIdUtil("000000000000000000000000");
        expect(result).toBeNull();
    });
    it("returns full constant document by id", async () => {
        const constant = await Constant.create({
            name: "acme",
            title: "Acme",
            data: { key: "value" },
        });
        const result = await getConstantByIdUtil(constant._id.toString());
        expect(result).toBeTruthy();
        expect(result?._id.toString()).toBe(constant._id.toString());
        expect(result?.name).toBe("acme");
        expect(result?.title).toBe("Acme");
        expect(result?.data).toEqual({ key: "value" });
    });
});
