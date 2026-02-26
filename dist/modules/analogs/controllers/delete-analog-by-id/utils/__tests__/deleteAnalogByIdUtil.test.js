import { beforeEach, describe, expect, it } from "vitest";
import { Analog } from "../../../../models/Analog.js";
import { deleteAnalogByIdUtil } from "../deleteAnalogByIdUtil.js";
describe("deleteAnalogByIdUtil", () => {
    beforeEach(async () => {
        await Analog.deleteMany({});
    });
    it("returns null for non-existent id", async () => {
        const result = await deleteAnalogByIdUtil("000000000000000000000000");
        expect(result).toBeNull();
    });
    it("deletes analog and returns deleted document", async () => {
        const analog = await Analog.create({
            konkName: "k",
            prodName: "p",
            url: "https://x.com",
        });
        const result = await deleteAnalogByIdUtil(analog._id.toString());
        expect(result).toBeTruthy();
        expect(result?._id.toString()).toBe(analog._id.toString());
        const found = await Analog.findById(analog._id);
        expect(found).toBeNull();
    });
});
