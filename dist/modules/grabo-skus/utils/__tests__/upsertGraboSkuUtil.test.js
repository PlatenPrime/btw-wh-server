import { beforeEach, describe, expect, it } from "vitest";
import { GraboSku } from "../../models/GraboSku.js";
import { upsertGraboSkuUtil } from "../upsertGraboSkuUtil.js";
const fields = {
    title: "Pink Ribbon",
    productId: "G72272",
    isNew: true,
    color: "Pink",
    size: "M",
    material: "Foil",
    gas: "Helium",
    language: "No text",
    gasCapacity: "",
    tag: ["New"],
    images: ["https://www.grabo-balloons.com/img.jpg"],
    url: "https://www.grabo-balloons.com/en/g72272-balloon-pink-ribbon-pink",
};
describe("upsertGraboSkuUtil", () => {
    beforeEach(async () => {
        await GraboSku.deleteMany({});
    });
    it("creates a document on first seen productId", async () => {
        const now = new Date("2026-08-15T10:00:00.000Z");
        const result = await upsertGraboSkuUtil(fields, now);
        expect(result).toBe("created");
        const doc = await GraboSku.findOne({ productId: "G72272" }).lean();
        expect(doc).toMatchObject({
            title: "Pink Ribbon",
            color: "Pink",
            isNewProduct: true,
            tags: ["New"],
            isOnSite: true,
            url: fields.url,
        });
        expect(doc?.lastSeenAt.toISOString()).toBe(now.toISOString());
    });
    it("updates fields of existing productId", async () => {
        await upsertGraboSkuUtil(fields, new Date("2026-08-01T00:00:00.000Z"));
        const result = await upsertGraboSkuUtil({ ...fields, title: "Pink Ribbon Updated", isNew: false }, new Date("2026-08-15T12:00:00.000Z"));
        expect(result).toBe("updated");
        expect(await GraboSku.countDocuments()).toBe(1);
        const doc = await GraboSku.findOne({ productId: "G72272" }).lean();
        expect(doc?.title).toBe("Pink Ribbon Updated");
        expect(doc?.isNewProduct).toBe(false);
        expect(doc?.tags).toEqual(["New"]);
        expect(doc?.isOnSite).toBe(true);
    });
});
