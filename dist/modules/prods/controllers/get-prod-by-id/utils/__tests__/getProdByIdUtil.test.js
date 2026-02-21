import { beforeEach, describe, expect, it } from "vitest";
import { Prod } from "../../../../models/Prod.js";
import { getProdByIdUtil } from "../getProdByIdUtil.js";
describe("getProdByIdUtil", () => {
    beforeEach(async () => {
        await Prod.deleteMany({});
    });
    it("returns null for non-existent id", async () => {
        const result = await getProdByIdUtil("000000000000000000000000");
        expect(result).toBeNull();
    });
    it("returns full prod document by id", async () => {
        const prod = await Prod.create({
            name: "acme",
            title: "Acme Corp",
            imageUrl: "https://example.com/acme.png",
        });
        const result = await getProdByIdUtil(prod._id.toString());
        expect(result).toBeTruthy();
        expect(result?._id.toString()).toBe(prod._id.toString());
        expect(result?.name).toBe("acme");
        expect(result?.title).toBe("Acme Corp");
        expect(result?.imageUrl).toBe("https://example.com/acme.png");
    });
});
