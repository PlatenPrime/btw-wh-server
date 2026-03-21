import { beforeEach, describe, expect, it, vi } from "vitest";
import { Sku } from "../../../skus/models/Sku.js";
import { Skugr } from "../../models/Skugr.js";
import { fillSkugrSkusFromBrowserUtil } from "../fillSkugrSkusFromBrowserUtil.js";

vi.mock("../../../browser/group-products/fetchGroupProductsByKonkName.js", () => ({
  fetchGroupProductsByKonkName: vi.fn(),
}));

import { fetchGroupProductsByKonkName } from "../../../browser/group-products/fetchGroupProductsByKonkName.js";

const mockFetch = vi.mocked(fetchGroupProductsByKonkName);

describe("fillSkugrSkusFromBrowserUtil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it("returns null when skugr missing", async () => {
    const result = await fillSkugrSkusFromBrowserUtil("507f1f77bcf86cd799439011");
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("creates skus, adds to skugr; btradeAnalog stays default", async () => {
    mockFetch.mockResolvedValue([
      {
        title: "A",
        url: "https://yumi.example/p1",
        imageUrl: "https://cdn.example/img1.jpg",
      },
      {
        title: "B",
        url: "https://yumi.example/p2",
        imageUrl: "https://cdn.example/img2.jpg",
      },
    ]);

    const skugr = await Skugr.create({
      konkName: "yumi",
      prodName: "acme",
      title: "Group",
      url: "https://yumi.example/group",
      skus: [],
    });

    const result = await fillSkugrSkusFromBrowserUtil(skugr._id.toString());
    expect(result).not.toBeNull();
    expect(result!.stats.created).toBe(2);
    expect(result!.stats.linkedExisting).toBe(0);
    expect(result!.stats.skippedAlreadyInGroup).toBe(0);

    const skus = await Sku.find({}).sort({ url: 1 }).lean();
    expect(skus).toHaveLength(2);
    expect(skus[0].btradeAnalog).toBe("");
    expect(skus[1].btradeAnalog).toBe("");

    const refreshed = await Skugr.findById(skugr._id).lean();
    expect(refreshed!.skus).toHaveLength(2);
  });

  it("skips sku already linked to group", async () => {
    const existing = await Sku.create({
      konkName: "yumi",
      prodName: "other",
      title: "Old title",
      url: "https://yumi.example/ex",
    });

    const skugr = await Skugr.create({
      konkName: "yumi",
      prodName: "acme",
      title: "Group",
      url: "https://yumi.example/group",
      skus: [existing._id],
    });

    mockFetch.mockResolvedValue([
      { title: "New", url: "https://yumi.example/ex", imageUrl: "" },
    ]);

    const result = await fillSkugrSkusFromBrowserUtil(skugr._id.toString());
    expect(result!.stats.skippedAlreadyInGroup).toBe(1);
    expect(result!.stats.created).toBe(0);
    expect(result!.stats.linkedExisting).toBe(0);

    const still = await Sku.findById(existing._id).lean();
    expect(still!.title).toBe("Old title");
  });

  it("links existing sku not in group without updating sku fields", async () => {
    const existing = await Sku.create({
      konkName: "yumi",
      prodName: "other",
      title: "Keep me",
      url: "https://yumi.example/orphan",
    });

    const skugr = await Skugr.create({
      konkName: "yumi",
      prodName: "acme",
      title: "Group",
      url: "https://yumi.example/group",
      skus: [],
    });

    mockFetch.mockResolvedValue([
      {
        title: "Would overwrite",
        url: "https://yumi.example/orphan",
        imageUrl: "https://cdn.example/x.jpg",
      },
    ]);

    const result = await fillSkugrSkusFromBrowserUtil(skugr._id.toString());
    expect(result!.stats.linkedExisting).toBe(1);
    expect(result!.stats.created).toBe(0);

    const still = await Sku.findById(existing._id).lean();
    expect(still!.title).toBe("Keep me");

    const refreshed = await Skugr.findById(skugr._id).lean();
    expect(refreshed!.skus.map(String)).toContain(existing._id.toString());
  });

  it("dedupes duplicate urls from fetch (last title wins)", async () => {
    mockFetch.mockResolvedValue([
      {
        title: "First",
        url: "https://yumi.example/dup",
        imageUrl: "https://cdn.example/a.jpg",
      },
      {
        title: "Second",
        url: "https://yumi.example/dup",
        imageUrl: "https://cdn.example/b.jpg",
      },
    ]);

    const skugr = await Skugr.create({
      konkName: "yumi",
      prodName: "acme",
      title: "Group",
      url: "https://yumi.example/group",
      skus: [],
    });

    const result = await fillSkugrSkusFromBrowserUtil(skugr._id.toString());
    expect(result!.stats.dedupedByUrl).toBe(1);
    expect(result!.stats.created).toBe(1);

    const row = await Sku.findOne({ url: "https://yumi.example/dup" }).lean();
    expect(row!.title).toBe("Second");
    expect(row!.imageUrl).toBe("https://cdn.example/b.jpg");
  });
});
