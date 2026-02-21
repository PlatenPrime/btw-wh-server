import { beforeEach, describe, expect, it } from "vitest";
import { Del } from "../../../../models/Del.js";
import { getDelByIdUtil } from "../getDelByIdUtil.js";
describe("getDelByIdUtil", () => {
    beforeEach(async () => {
        await Del.deleteMany({});
    });
    it("returns null for non-existent id", async () => {
        const result = await getDelByIdUtil("000000000000000000000000");
        expect(result).toBeNull();
    });
    it("returns full del document by id", async () => {
        const del = await Del.create({
            title: "Test Del",
            prodName: "prod1",
            prod: { title: "Producer One", imageUrl: "https://example.com/prod1.png" },
            artikuls: {
                "ART-1": { quantity: 5 },
                "ART-2": { quantity: 10, nameukr: "Товар" },
            },
        });
        const result = await getDelByIdUtil(del._id.toString());
        expect(result).toBeTruthy();
        expect(result?._id.toString()).toBe(del._id.toString());
        expect(result?.title).toBe("Test Del");
        expect(result?.prod).toMatchObject({
            title: "Producer One",
            imageUrl: "https://example.com/prod1.png",
        });
        const artikuls = result?.artikuls ?? {};
        expect(artikuls["ART-1"]).toEqual({ quantity: 5 });
        expect(artikuls["ART-2"]).toEqual({ quantity: 10, nameukr: "Товар" });
    });
});
