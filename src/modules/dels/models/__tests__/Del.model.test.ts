import { beforeEach, describe, expect, it } from "vitest";
import { Del } from "../Del.js";

describe("Del Model", () => {
  beforeEach(async () => {
    await Del.deleteMany({});
  });

  describe("Schema Validation", () => {
    it("should fail without required title field", async () => {
      const delData = { artikuls: {} };
      const del = new Del(delData);
      await expect(del.save()).rejects.toThrow();
    });

    it("should save with title and empty artikuls", async () => {
      const delData = { title: "Поставка 1", artikuls: {} };
      const del = new Del(delData);
      const saved = await del.save();
      expect(saved.title).toBe("Поставка 1");
      expect(saved.toObject().artikuls).toEqual({});
      expect(saved.createdAt).toBeInstanceOf(Date);
      expect(saved.updatedAt).toBeInstanceOf(Date);
    });

    it("should save with title and artikuls object", async () => {
      const delData = {
        title: "Поставка с артикулами",
        artikuls: { "ART-001": 10, "ART-002": 5 },
      };
      const del = new Del(delData);
      const saved = await del.save();
      expect(saved.title).toBe("Поставка с артикулами");
      const artikulsObj = saved.toObject().artikuls as Record<string, number>;
      expect(artikulsObj).toBeDefined();
      expect(artikulsObj["ART-001"]).toBe(10);
      expect(artikulsObj["ART-002"]).toBe(5);
    });

    it("should have timestamps", async () => {
      const del = new Del({ title: "Test", artikuls: {} });
      const saved = await del.save();
      expect(saved.createdAt).toBeDefined();
      expect(saved.updatedAt).toBeDefined();
    });
  });
});
