import { beforeEach, describe, expect, it } from "vitest";
import { Kask } from "../../../../models/Kask.js";
import { deleteKaskUtil } from "../deleteKaskUtil.js";
describe("deleteKaskUtil", () => {
    beforeEach(async () => {
        await Kask.deleteMany({});
    });
    it("returns null when kask not found", async () => {
        const result = await deleteKaskUtil("000000000000000000000000");
        expect(result).toBeNull();
    });
    it("deletes kask and returns deleted document", async () => {
        const kask = await Kask.create({
            artikul: "1234-5678",
            nameukr: "To delete",
            zone: "A1",
        });
        const result = await deleteKaskUtil(String(kask._id));
        expect(result).toBeTruthy();
        expect(result?.artikul).toBe("1234-5678");
        const found = await Kask.findById(kask._id);
        expect(found).toBeNull();
    });
});
