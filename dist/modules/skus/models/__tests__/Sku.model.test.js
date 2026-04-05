import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../Sku.js";
describe("Sku Model", () => {
    beforeEach(async () => {
        await Sku.deleteMany({});
    });
    describe("Schema Validation", () => {
        it("should fail without required fields", async () => {
            const sku = new Sku({ title: "Only title" });
            await expect(sku.save()).rejects.toThrow();
        });
        it("should set btradeAnalog and imageUrl as empty string by default", async () => {
            const saved = await Sku.create({
                konkName: "konk-a",
                prodName: "prod-a",
                productId: "konk-a-1",
                title: "Sku A",
                url: "https://konk-a.com/sku-a",
            });
            expect(saved.btradeAnalog).toBe("");
            expect(saved.imageUrl).toBe("");
            expect(saved.isInvalid).toBe(false);
        });
        it("should save with all required fields", async () => {
            const saved = await Sku.create({
                konkName: "konk-b",
                prodName: "prod-b",
                productId: "konk-b-2",
                btradeAnalog: "BT-123",
                title: "Sku B",
                url: "https://konk-b.com/sku-b",
            });
            expect(saved.konkName).toBe("konk-b");
            expect(saved.prodName).toBe("prod-b");
            expect(saved.productId).toBe("konk-b-2");
            expect(saved.btradeAnalog).toBe("BT-123");
            expect(saved.title).toBe("Sku B");
            expect(saved.url).toBe("https://konk-b.com/sku-b");
            expect(saved.imageUrl).toBe("");
            expect(saved.createdAt).toBeInstanceOf(Date);
            expect(saved.updatedAt).toBeInstanceOf(Date);
        });
        it("should enforce unique url", async () => {
            await Sku.create({
                konkName: "konk-c",
                prodName: "prod-c",
                productId: "konk-c-1",
                title: "Sku C1",
                url: "https://konk-c.com/sku-c",
            });
            const second = new Sku({
                konkName: "konk-d",
                prodName: "prod-d",
                productId: "konk-d-1",
                title: "Sku C2",
                url: "https://konk-c.com/sku-c",
            });
            await expect(second.save()).rejects.toThrow();
        });
        it("should enforce unique productId", async () => {
            await Sku.create({
                konkName: "konk-e",
                prodName: "prod-e",
                productId: "shared-pid-1",
                title: "One",
                url: "https://e.com/1",
            });
            const second = new Sku({
                konkName: "konk-e",
                prodName: "prod-e",
                productId: "shared-pid-1",
                title: "Two",
                url: "https://e.com/2",
            });
            await expect(second.save()).rejects.toThrow();
        });
    });
});
