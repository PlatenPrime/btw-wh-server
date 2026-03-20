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

    it("should set btradeAnalog as empty string by default", async () => {
      const saved = await Sku.create({
        konkName: "konk-a",
        prodName: "prod-a",
        title: "Sku A",
        url: "https://konk-a.com/sku-a",
      });

      expect(saved.btradeAnalog).toBe("");
    });

    it("should save with all required fields", async () => {
      const saved = await Sku.create({
        konkName: "konk-b",
        prodName: "prod-b",
        btradeAnalog: "BT-123",
        title: "Sku B",
        url: "https://konk-b.com/sku-b",
      });

      expect(saved.konkName).toBe("konk-b");
      expect(saved.prodName).toBe("prod-b");
      expect(saved.btradeAnalog).toBe("BT-123");
      expect(saved.title).toBe("Sku B");
      expect(saved.url).toBe("https://konk-b.com/sku-b");
      expect(saved.createdAt).toBeInstanceOf(Date);
      expect(saved.updatedAt).toBeInstanceOf(Date);
    });

    it("should enforce unique url", async () => {
      await Sku.create({
        konkName: "konk-c",
        prodName: "prod-c",
        title: "Sku C1",
        url: "https://konk-c.com/sku-c",
      });

      const second = new Sku({
        konkName: "konk-d",
        prodName: "prod-d",
        title: "Sku C2",
        url: "https://konk-c.com/sku-c",
      });

      await expect(second.save()).rejects.toThrow();
    });
  });
});
