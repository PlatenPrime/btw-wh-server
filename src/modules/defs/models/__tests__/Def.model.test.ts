import { beforeEach, describe, expect, it } from "vitest";
import { Def } from "../Def.js";

describe("Def Model", () => {
  beforeEach(async () => {
    await Def.deleteMany({});
  });

  describe("Schema Validation", () => {
    it("should fail without required result field", async () => {
      const def = new Def({
        total: 0,
        totalCriticalDefs: 0,
        totalLimitDefs: 0,
      });
      await expect(def.save()).rejects.toThrow();
    });

    it("should save with dynamic result keys", async () => {
      const def = new Def({
        result: {
          ART001: {
            nameukr: "Товар 1",
            quant: 10,
            sharikQuant: 5,
            difQuant: -5,
            defLimit: 30,
            status: "critical",
          },
        },
        total: 1,
        totalCriticalDefs: 1,
        totalLimitDefs: 0,
      });

      const saved = await def.save();
      expect(saved.total).toBe(1);
      expect(saved.result.ART001).toMatchObject({
        nameukr: "Товар 1",
        status: "critical",
      });
      expect(saved.createdAt).toBeInstanceOf(Date);
      expect(saved.updatedAt).toBeInstanceOf(Date);
    });

    it("should default totals to 0", async () => {
      const def = new Def({
        result: {},
      });
      const saved = await def.save();
      expect(saved.total).toBe(0);
      expect(saved.totalCriticalDefs).toBe(0);
      expect(saved.totalLimitDefs).toBe(0);
    });

    it("should store empty result object", async () => {
      const def = await Def.create({
        result: {},
        total: 0,
        totalCriticalDefs: 0,
        totalLimitDefs: 0,
      });
      expect(def.toObject().result).toEqual({});
    });
  });
});
