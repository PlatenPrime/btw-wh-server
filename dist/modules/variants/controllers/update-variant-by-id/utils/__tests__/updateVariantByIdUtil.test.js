import { beforeEach, describe, expect, it } from "vitest";
import { Variant } from "../../../../models/Variant.js";
import { updateVariantByIdUtil } from "../updateVariantByIdUtil.js";
describe("updateVariantByIdUtil", () => {
    beforeEach(async () => {
        await Variant.deleteMany({});
    });
    it("returns null for non-existent id", async () => {
        const result = await updateVariantByIdUtil({
            id: "000000000000000000000000",
            url: "https://updated.com",
        });
        expect(result).toBeNull();
    });
    it("updates url and returns updated variant", async () => {
        const variant = await Variant.create({
            konkName: "k",
            prodName: "p",
            title: "Variant",
            url: "https://old.com",
            imageUrl: "https://example.com/old.png",
        });
        const result = await updateVariantByIdUtil({
            id: variant._id.toString(),
            url: "https://new.com",
        });
        expect(result?.url).toBe("https://new.com");
        const found = await Variant.findById(variant._id);
        expect(found?.url).toBe("https://new.com");
    });
    it("updates varGroup", async () => {
        const variant = await Variant.create({
            konkName: "k",
            prodName: "p",
            title: "Variant",
            url: "https://x.com",
            imageUrl: "https://example.com/x.png",
        });
        const result = await updateVariantByIdUtil({
            id: variant._id.toString(),
            varGroup: { id: "group-2", title: "Group 2" },
        });
        expect(result?.varGroup?.id).toBe("group-2");
        expect(result?.varGroup?.title).toBe("Group 2");
    });
    it("returns same doc when no update fields (only id)", async () => {
        const variant = await Variant.create({
            konkName: "k",
            prodName: "p",
            title: "Variant",
            url: "https://x.com",
            imageUrl: "https://example.com/x.png",
        });
        const result = await updateVariantByIdUtil({
            id: variant._id.toString(),
        });
        expect(result?._id.toString()).toBe(variant._id.toString());
    });
});
