import { beforeEach, describe, expect, it } from "vitest";
import { Analog } from "../Analog.js";

describe("Analog Model", () => {
  beforeEach(async () => {
    await Analog.deleteMany({});
  });

  describe("Schema Validation", () => {
    it("should fail without required konkName field", async () => {
      const data = {
        prodName: "prod",
        url: "https://example.com/page",
      };
      const doc = new Analog(data);
      await expect(doc.save()).rejects.toThrow();
    });

    it("should fail without required prodName field", async () => {
      const data = {
        konkName: "konk",
        url: "https://example.com/page",
      };
      const doc = new Analog(data);
      await expect(doc.save()).rejects.toThrow();
    });

    it("should fail without required url field", async () => {
      const data = {
        konkName: "konk",
        prodName: "prod",
      };
      const doc = new Analog(data);
      await expect(doc.save()).rejects.toThrow();
    });

    it("should save with required fields and default artikul", async () => {
      const data = {
        konkName: "acme",
        prodName: "maker",
        url: "https://example.com/product/1",
      };
      const doc = await Analog.create(data);
      expect(doc.konkName).toBe("acme");
      expect(doc.prodName).toBe("maker");
      expect(doc.url).toBe("https://example.com/product/1");
      expect(doc.artikul).toBe("");
      expect(doc.createdAt).toBeInstanceOf(Date);
      expect(doc.updatedAt).toBeInstanceOf(Date);
    });

    it("should save with optional artikul, nameukr, title, imageUrl", async () => {
      const data = {
        konkName: "konk",
        prodName: "prod",
        url: "https://example.com/p",
        artikul: "ART-001",
        nameukr: "Назва товару",
        title: "Competitor product title",
        imageUrl: "https://example.com/img.png",
      };
      const doc = await Analog.create(data);
      expect(doc.artikul).toBe("ART-001");
      expect(doc.nameukr).toBe("Назва товару");
      expect(doc.title).toBe("Competitor product title");
      expect(doc.imageUrl).toBe("https://example.com/img.png");
    });

    it("should have timestamps", async () => {
      const doc = await Analog.create({
        konkName: "k",
        prodName: "p",
        url: "https://x.com",
      });
      expect(doc.createdAt).toBeDefined();
      expect(doc.updatedAt).toBeDefined();
    });
  });
});
