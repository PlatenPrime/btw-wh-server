import { beforeEach, describe, expect, it } from "vitest";
import { Prod } from "../Prod.js";

describe("Prod Model", () => {
  beforeEach(async () => {
    await Prod.deleteMany({});
  });

  describe("Schema Validation", () => {
    it("should fail without required name field", async () => {
      const prodData = { title: "Title", imageUrl: "https://example.com/img.png" };
      const prod = new Prod(prodData);
      await expect(prod.save()).rejects.toThrow();
    });

    it("should fail without required title field", async () => {
      const prodData = { name: "key", imageUrl: "https://example.com/img.png" };
      const prod = new Prod(prodData);
      await expect(prod.save()).rejects.toThrow();
    });

    it("should fail without required imageUrl field", async () => {
      const prodData = { name: "key", title: "Title" };
      const prod = new Prod(prodData);
      await expect(prod.save()).rejects.toThrow();
    });

    it("should save with all required fields", async () => {
      const prodData = {
        name: "acme",
        title: "Acme Corp",
        imageUrl: "https://example.com/acme.png",
      };
      const prod = new Prod(prodData);
      const saved = await prod.save();
      expect(saved.name).toBe("acme");
      expect(saved.title).toBe("Acme Corp");
      expect(saved.imageUrl).toBe("https://example.com/acme.png");
      expect(saved.createdAt).toBeInstanceOf(Date);
      expect(saved.updatedAt).toBeInstanceOf(Date);
    });

    it("should have timestamps", async () => {
      const prod = new Prod({
        name: "x",
        title: "X",
        imageUrl: "https://x.com/1.png",
      });
      const saved = await prod.save();
      expect(saved.createdAt).toBeDefined();
      expect(saved.updatedAt).toBeDefined();
    });

    it("should enforce unique name", async () => {
      await Prod.create({
        name: "dup",
        title: "First",
        imageUrl: "https://a.com/1.png",
      });
      const second = new Prod({
        name: "dup",
        title: "Second",
        imageUrl: "https://a.com/2.png",
      });
      await expect(second.save()).rejects.toThrow();
    });
  });
});
