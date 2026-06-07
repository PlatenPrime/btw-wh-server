import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup.js";
import { PalletGroup } from "../PalletGroup.js";

describe("PalletGroup Model", () => {
  beforeEach(async () => {
    await PalletGroup.deleteMany({});
  });

  it("fails without required title", async () => {
    const group = new PalletGroup({ order: 1, pallets: [] });
    await expect(group.save()).rejects.toThrow();
  });

  it("fails without required order", async () => {
    const group = new PalletGroup({ title: "Group A", pallets: [] });
    await expect(group.save()).rejects.toThrow();
  });

  it("fails when order is less than 1", async () => {
    const group = new PalletGroup({ title: "Group A", order: 0, pallets: [] });
    await expect(group.save()).rejects.toThrow();
  });

  it("saves with all required fields", async () => {
    const saved = await PalletGroup.create({
      title: "Group A",
      order: 1,
      pallets: [],
    });

    expect(saved.title).toBe("Group A");
    expect(saved.order).toBe(1);
    expect(saved.pallets).toEqual([]);
    expect(saved.createdAt).toBeInstanceOf(Date);
    expect(saved.updatedAt).toBeInstanceOf(Date);
  });

  it("enforces unique title", async () => {
    await PalletGroup.create({ title: "Unique Group", order: 1, pallets: [] });

    const duplicate = new PalletGroup({
      title: "Unique Group",
      order: 2,
      pallets: [],
    });
    await expect(duplicate.save()).rejects.toThrow();
  });
});
