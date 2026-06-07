import { Types } from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup.js";
import { Seg } from "../Seg.js";

const createBlockData = (overrides: Partial<{ _id: Types.ObjectId; title: string }> = {}) => ({
  _id: overrides._id ?? new Types.ObjectId(),
  title: overrides.title ?? "Test Block",
});

const createZoneSubdoc = (overrides: Partial<{ _id: Types.ObjectId; title: string }> = {}) => ({
  _id: overrides._id ?? new Types.ObjectId(),
  title: overrides.title ?? "10-1",
});

describe("Seg Model", () => {
  beforeEach(async () => {
    await Seg.deleteMany({});
  });

  describe("Schema Validation", () => {
    it("should fail without required block", async () => {
      const seg = new Seg({
        blockData: createBlockData(),
        order: 1,
        sector: 1001,
        zones: [createZoneSubdoc()],
      });

      await expect(seg.save()).rejects.toThrow();
    });

    it("should fail without required blockData", async () => {
      const seg = new Seg({
        block: new Types.ObjectId(),
        order: 1,
        sector: 1001,
        zones: [createZoneSubdoc()],
      });

      await expect(seg.save()).rejects.toThrow();
    });

    it("should fail without required order", async () => {
      const blockId = new Types.ObjectId();
      const seg = new Seg({
        block: blockId,
        blockData: createBlockData({ _id: blockId }),
        sector: 1001,
        zones: [createZoneSubdoc()],
      });

      await expect(seg.save()).rejects.toThrow();
    });

    it("should fail when order is less than 1", async () => {
      const blockId = new Types.ObjectId();
      const seg = new Seg({
        block: blockId,
        blockData: createBlockData({ _id: blockId }),
        order: 0,
        sector: 1000,
        zones: [createZoneSubdoc()],
      });

      await expect(seg.save()).rejects.toThrow();
    });

    it("should fail when sector is negative", async () => {
      const blockId = new Types.ObjectId();
      const seg = new Seg({
        block: blockId,
        blockData: createBlockData({ _id: blockId }),
        order: 1,
        sector: -1,
        zones: [createZoneSubdoc()],
      });

      await expect(seg.save()).rejects.toThrow();
    });

    it("should fail when blockData is missing _id or title", async () => {
      const blockId = new Types.ObjectId();

      const segWithoutBlockId = new Seg({
        block: blockId,
        blockData: { title: "No ID" },
        order: 1,
        sector: 1001,
        zones: [createZoneSubdoc()],
      });
      await expect(segWithoutBlockId.save()).rejects.toThrow();

      const segWithoutTitle = new Seg({
        block: blockId,
        blockData: { _id: blockId },
        order: 1,
        sector: 1001,
        zones: [createZoneSubdoc()],
      });
      await expect(segWithoutTitle.save()).rejects.toThrow();
    });

    it("should save with all required fields", async () => {
      const blockId = new Types.ObjectId();
      const zoneId = new Types.ObjectId();

      const seg = await Seg.create({
        block: blockId,
        blockData: createBlockData({ _id: blockId, title: "Block A" }),
        order: 2,
        sector: 2002,
        zones: [createZoneSubdoc({ _id: zoneId, title: "20-2" })],
      });

      expect(seg.block.toString()).toBe(blockId.toString());
      expect(seg.blockData.title).toBe("Block A");
      expect(seg.order).toBe(2);
      expect(seg.sector).toBe(2002);
      expect(seg.zones).toHaveLength(1);
      expect(seg.zones[0]._id.toString()).toBe(zoneId.toString());
      expect(seg.zones[0].title).toBe("20-2");
    });

    it("should default sector to 0 when not provided", async () => {
      const blockId = new Types.ObjectId();

      const seg = new Seg({
        block: blockId,
        blockData: createBlockData({ _id: blockId }),
        order: 1,
        zones: [],
      });

      const saved = await seg.save();
      expect(saved.sector).toBe(0);
    });

    it("should allow empty zones array", async () => {
      const blockId = new Types.ObjectId();

      const seg = await Seg.create({
        block: blockId,
        blockData: createBlockData({ _id: blockId }),
        order: 1,
        sector: 1001,
        zones: [],
      });

      expect(seg.zones).toEqual([]);
    });

    it("should have timestamps", async () => {
      const blockId = new Types.ObjectId();

      const seg = await Seg.create({
        block: blockId,
        blockData: createBlockData({ _id: blockId }),
        order: 1,
        sector: 1001,
        zones: [],
      });

      expect(seg.createdAt).toBeInstanceOf(Date);
      expect(seg.updatedAt).toBeInstanceOf(Date);
    });
  });
});
