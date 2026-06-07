import { beforeEach, describe, expect, it } from "vitest";
import { Kask } from "../Kask.js";

describe("Kask Model", () => {
  beforeEach(async () => {
    await Kask.deleteMany({});
  });

  describe("Schema Validation", () => {
    it("should fail without required artikul field", async () => {
      const kask = new Kask({
        nameukr: "Товар",
        zone: "A1",
      });
      await expect(kask.save()).rejects.toThrow();
    });

    it("should fail without required nameukr field", async () => {
      const kask = new Kask({
        artikul: "1234-5678",
        zone: "A1",
      });
      await expect(kask.save()).rejects.toThrow();
    });

    it("should fail without required zone field", async () => {
      const kask = new Kask({
        artikul: "1234-5678",
        nameukr: "Товар",
      });
      await expect(kask.save()).rejects.toThrow();
    });

    it("should save with required fields only", async () => {
      const saved = await Kask.create({
        artikul: "1234-5678",
        nameukr: "Тестовий товар",
        zone: "42-5-1",
      });
      expect(saved.artikul).toBe("1234-5678");
      expect(saved.nameukr).toBe("Тестовий товар");
      expect(saved.zone).toBe("42-5-1");
      expect(saved.quant).toBeUndefined();
      expect(saved.com).toBeUndefined();
      expect(saved.createdAt).toBeInstanceOf(Date);
      expect(saved.updatedAt).toBeInstanceOf(Date);
    });

    it("should save with optional quant and com", async () => {
      const saved = await Kask.create({
        artikul: "9999-0001",
        nameukr: "Товар з опціями",
        zone: "B2",
        quant: 5,
        com: "Терміново",
      });
      expect(saved.quant).toBe(5);
      expect(saved.com).toBe("Терміново");
    });

    it("should have timestamps", async () => {
      const saved = await Kask.create({
        artikul: "1111-2222",
        nameukr: "Timestamp test",
        zone: "C3",
      });
      expect(saved.createdAt).toBeDefined();
      expect(saved.updatedAt).toBeDefined();
    });
  });
});
