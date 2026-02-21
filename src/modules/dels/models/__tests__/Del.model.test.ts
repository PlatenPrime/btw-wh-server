import { beforeEach, describe, expect, it } from "vitest";
import { Del } from "../Del.js";

describe("Del Model", () => {
  beforeEach(async () => {
    await Del.deleteMany({});
  });

  describe("Schema Validation", () => {
    it("should fail without required title field", async () => {
      const delData = { prodName: "prod1", artikuls: {} };
      const del = new Del(delData);
      await expect(del.save()).rejects.toThrow();
    });

    it("should fail without required prodName field", async () => {
      const delData = { title: "Поставка 1", artikuls: {} };
      const del = new Del(delData);
      await expect(del.save()).rejects.toThrow();
    });

    it("should save with title, prodName and empty artikuls", async () => {
      const delData = {
        title: "Поставка 1",
        prodName: "prod1",
        artikuls: {},
      };
      const del = new Del(delData);
      const saved = await del.save();
      expect(saved.title).toBe("Поставка 1");
      expect(saved.prodName).toBe("prod1");
      expect(saved.toObject().artikuls).toEqual({});
      expect(saved.createdAt).toBeInstanceOf(Date);
      expect(saved.updatedAt).toBeInstanceOf(Date);
    });

    it("should save with title, prodName and artikuls object", async () => {
      const delData = {
        title: "Поставка с артикулами",
        prodName: "prod1",
        artikuls: {
          "ART-001": { quantity: 10 },
          "ART-002": { quantity: 5, nameukr: "Товар" },
        },
      };
      const del = new Del(delData);
      const saved = await del.save();
      expect(saved.title).toBe("Поставка с артикулами");
      expect(saved.prodName).toBe("prod1");
      const artikulsObj = saved.toObject().artikuls as Record<
        string,
        { quantity: number; nameukr?: string }
      >;
      expect(artikulsObj).toBeDefined();
      expect(artikulsObj["ART-001"]).toEqual({ quantity: 10 });
      expect(artikulsObj["ART-002"]).toEqual({ quantity: 5, nameukr: "Товар" });
    });

    it("should have timestamps", async () => {
      const del = new Del({
        title: "Test",
        prodName: "prod1",
        artikuls: {},
      });
      const saved = await del.save();
      expect(saved.createdAt).toBeDefined();
      expect(saved.updatedAt).toBeDefined();
    });
  });
});
