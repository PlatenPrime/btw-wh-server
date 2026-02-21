import { beforeEach, describe, expect, it } from "vitest";
import { Prod } from "../../../../models/Prod.js";
import { getAllProdsUtil } from "../getAllProdsUtil.js";
describe("getAllProdsUtil", () => {
    beforeEach(async () => {
        await Prod.deleteMany({});
    });
    it("returns empty array when no prods", async () => {
        const result = await getAllProdsUtil();
        expect(result).toEqual([]);
    });
    it("returns all prods with full fields", async () => {
        await Prod.create({
            name: "a",
            title: "A",
            imageUrl: "https://a.com/1.png",
        });
        const result = await getAllProdsUtil();
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveProperty("name", "a");
        expect(result[0]).toHaveProperty("title", "A");
        expect(result[0]).toHaveProperty("imageUrl", "https://a.com/1.png");
        expect(result[0]).toHaveProperty("_id");
        expect(result[0]).toHaveProperty("createdAt");
        expect(result[0]).toHaveProperty("updatedAt");
    });
    it("returns multiple prods sorted by createdAt desc", async () => {
        await Prod.create({
            name: "first",
            title: "First",
            imageUrl: "https://f.com/1.png",
        });
        await Prod.create({
            name: "second",
            title: "Second",
            imageUrl: "https://s.com/1.png",
        });
        const result = await getAllProdsUtil();
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe("second");
        expect(result[1].name).toBe("first");
    });
});
