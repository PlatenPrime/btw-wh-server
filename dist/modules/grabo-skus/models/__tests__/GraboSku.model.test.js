import { beforeEach, describe, expect, it } from "vitest";
import { GraboSku } from "../GraboSku.js";
function validGraboSku(overrides = {}) {
    return {
        title: "Pink Ribbon",
        productId: "G72272",
        url: "https://www.grabo-balloons.com/en/g72272-balloon-pink-ribbon-pink",
        lastSeenAt: new Date("2026-08-15T00:00:00.000Z"),
        ...overrides,
    };
}
describe("GraboSku model", () => {
    beforeEach(async () => {
        await GraboSku.deleteMany({});
    });
    it("saves with defaults and timestamps", async () => {
        const saved = await GraboSku.create(validGraboSku());
        expect(saved.productId).toBe("G72272");
        expect(saved.isNewProduct).toBe(false);
        expect(saved.isOnSite).toBe(true);
        expect(saved.tags).toEqual([]);
        expect(saved.images).toEqual([]);
        expect(saved.color).toBe("");
        expect(saved.size).toBe("");
        expect(saved.material).toBe("");
        expect(saved.gas).toBe("");
        expect(saved.language).toBe("");
        expect(saved.gasCapacity).toBe("");
        expect(saved.createdAt).toBeInstanceOf(Date);
        expect(saved.updatedAt).toBeInstanceOf(Date);
    });
    it("persists isNewProduct without colliding with Document.isNew", async () => {
        const saved = await GraboSku.create(validGraboSku({ isNewProduct: true }));
        expect(saved.isNew).toBe(false);
        expect(saved.isNewProduct).toBe(true);
        expect(saved.createdAt).toBeInstanceOf(Date);
        expect((await GraboSku.findById(saved._id).lean())?.isNewProduct).toBe(true);
    });
    it("fails without productId", async () => {
        const doc = new GraboSku(validGraboSku({ productId: undefined }));
        await expect(doc.save()).rejects.toThrow();
    });
    it("fails without url", async () => {
        const doc = new GraboSku(validGraboSku({ url: undefined }));
        await expect(doc.save()).rejects.toThrow();
    });
    it("fails without lastSeenAt", async () => {
        const doc = new GraboSku(validGraboSku({ lastSeenAt: undefined }));
        await expect(doc.save()).rejects.toThrow();
    });
    it("enforces unique productId", async () => {
        await GraboSku.create(validGraboSku());
        const dup = new GraboSku(validGraboSku({
            url: "https://www.grabo-balloons.com/en/other",
        }));
        await expect(dup.save()).rejects.toThrow();
    });
});
