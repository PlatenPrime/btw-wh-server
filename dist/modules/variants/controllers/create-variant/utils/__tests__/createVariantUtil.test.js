import { beforeEach, describe, expect, it } from "vitest";
import { Variant } from "../../../../models/Variant.js";
import { createVariantUtil } from "../createVariantUtil.js";
describe("createVariantUtil", () => {
    beforeEach(async () => {
        await Variant.deleteMany({});
    });
    it("creates variant with required fields", async () => {
        const result = await createVariantUtil({
            konkName: "acme",
            prodName: "maker",
            title: "Variant 1",
            url: "https://example.com/page",
            imageUrl: "https://example.com/img.png",
        });
        expect(result._id).toBeDefined();
        expect(result.konkName).toBe("acme");
        expect(result.prodName).toBe("maker");
        expect(result.title).toBe("Variant 1");
        expect(result.url).toBe("https://example.com/page");
        expect(result.imageUrl).toBe("https://example.com/img.png");
        expect(result.varGroup).toBeUndefined();
        expect(result.createdAt).toBeDefined();
        expect(result.updatedAt).toBeDefined();
    });
    it("creates variant with varGroup", async () => {
        const result = await createVariantUtil({
            konkName: "acme",
            prodName: "maker",
            title: "Variant 2",
            url: "https://example.com/page-2",
            imageUrl: "https://example.com/img-2.png",
            varGroup: { id: "group-1", title: "Group 1" },
        });
        expect(result.varGroup?.id).toBe("group-1");
        expect(result.varGroup?.title).toBe("Group 1");
    });
});
