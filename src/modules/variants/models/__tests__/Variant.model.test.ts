import { beforeEach, describe, expect, it } from "vitest";
import { Variant } from "../Variant.js";

describe("Variant Model", () => {
  beforeEach(async () => {
    await Variant.deleteMany({});
  });

  describe("Schema Validation", () => {
    it("should fail without required konkName field", async () => {
      const data = {
        prodName: "prod",
        title: "title",
        url: "https://example.com/page",
        imageUrl: "https://example.com/img.png",
      };
      const doc = new Variant(data);
      await expect(doc.save()).rejects.toThrow();
    });

    it("should fail without required prodName field", async () => {
      const data = {
        konkName: "konk",
        title: "title",
        url: "https://example.com/page",
        imageUrl: "https://example.com/img.png",
      };
      const doc = new Variant(data);
      await expect(doc.save()).rejects.toThrow();
    });

    it("should fail without required title field", async () => {
      const data = {
        konkName: "konk",
        prodName: "prod",
        url: "https://example.com/page",
        imageUrl: "https://example.com/img.png",
      };
      const doc = new Variant(data);
      await expect(doc.save()).rejects.toThrow();
    });

    it("should fail without required url field", async () => {
      const data = {
        konkName: "konk",
        prodName: "prod",
        title: "title",
        imageUrl: "https://example.com/img.png",
      };
      const doc = new Variant(data);
      await expect(doc.save()).rejects.toThrow();
    });

    it("should fail without required imageUrl field", async () => {
      const data = {
        konkName: "konk",
        prodName: "prod",
        title: "title",
        url: "https://example.com/page",
      };
      const doc = new Variant(data);
      await expect(doc.save()).rejects.toThrow();
    });

    it("should save with required fields", async () => {
      const data = {
        konkName: "acme",
        prodName: "maker",
        title: "Variant 1",
        url: "https://example.com/product/1",
        imageUrl: "https://example.com/product/1.png",
      };

      const doc = await Variant.create(data);

      expect(doc.konkName).toBe("acme");
      expect(doc.prodName).toBe("maker");
      expect(doc.title).toBe("Variant 1");
      expect(doc.url).toBe("https://example.com/product/1");
      expect(doc.imageUrl).toBe("https://example.com/product/1.png");
      expect(doc.varGroup).toBeUndefined();
      expect(doc.createdAt).toBeInstanceOf(Date);
      expect(doc.updatedAt).toBeInstanceOf(Date);
    });

    it("should save with optional varGroup", async () => {
      const doc = await Variant.create({
        konkName: "acme",
        prodName: "maker",
        title: "Variant 2",
        url: "https://example.com/product/2",
        imageUrl: "https://example.com/product/2.png",
        varGroup: { id: "group-1", title: "Group title" },
      });

      expect(doc.varGroup?.id).toBe("group-1");
      expect(doc.varGroup?.title).toBe("Group title");
    });

    it("should fail varGroup when required keys are missing", async () => {
      const doc = new Variant({
        konkName: "acme",
        prodName: "maker",
        title: "Variant 3",
        url: "https://example.com/product/3",
        imageUrl: "https://example.com/product/3.png",
        varGroup: { id: "group-1" },
      });
      await expect(doc.save()).rejects.toThrow();
    });

    it("should reject duplicate url", async () => {
      const url = "https://example.com/unique-page";
      await Variant.create({
        konkName: "k1",
        prodName: "p",
        title: "Variant A",
        url,
        imageUrl: "https://example.com/img-a.png",
      });

      await expect(
        Variant.create({
          konkName: "k2",
          prodName: "p",
          title: "Variant B",
          url,
          imageUrl: "https://example.com/img-b.png",
        })
      ).rejects.toThrow();

      const count = await Variant.countDocuments();
      expect(count).toBe(1);
    });
  });
});

