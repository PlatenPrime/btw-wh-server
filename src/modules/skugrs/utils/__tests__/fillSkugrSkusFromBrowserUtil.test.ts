import { beforeEach, describe, expect, it, vi } from "vitest";
import { NEWSKU_PROD_NAME } from "../../../skus/constants/newskuProdName.js";
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
        productId: "101",
      },
      {
        title: "B",
        url: "https://yumi.example/p2",
        imageUrl: "https://cdn.example/img2.jpg",
        productId: "102",
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
    expect(skus[0]!.productId).toBe("yumi-101");
    expect(skus[1]!.productId).toBe("yumi-102");
    expect(skus[0].btradeAnalog).toBe("");
    expect(skus[1].btradeAnalog).toBe("");

    const refreshed = await Skugr.findById(skugr._id).lean();
    expect(refreshed!.skus).toHaveLength(2);
  });

  it("skips sku already linked to group", async () => {
    const existing = await Sku.create({
      konkName: "yumi",
      prodName: "other",
      productId: "yumi-999",
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
      {
        title: "New",
        url: "https://yumi.example/ex",
        imageUrl: "",
        productId: "999",
      },
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
      productId: "yumi-888",
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
        productId: "888",
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
        productId: "777",
      },
      {
        title: "Second",
        url: "https://yumi.example/dup",
        imageUrl: "https://cdn.example/b.jpg",
        productId: "777",
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
    expect(row!.productId).toBe("yumi-777");
  });

  it("newsku group does not link sku that already has another prodName", async () => {
    const existing = await Sku.create({
      konkName: "yumi",
      prodName: "acme",
      productId: "yumi-501",
      title: "Real brand",
      url: "https://yumi.example/newbie",
    });

    const skugr = await Skugr.create({
      konkName: "yumi",
      prodName: NEWSKU_PROD_NAME,
      title: "New only",
      url: "https://yumi.example/new-page",
      skus: [],
    });

    mockFetch.mockResolvedValue([
      {
        title: "Parsed",
        url: "https://yumi.example/newbie",
        imageUrl: "",
        productId: "501",
      },
    ]);

    const result = await fillSkugrSkusFromBrowserUtil(skugr._id.toString());
    expect(result!.stats.skippedNonNewskuManufacturer).toBe(1);
    expect(result!.stats.linkedExisting).toBe(0);
    expect(result!.stats.promotedFromNewsku).toBe(0);

    const refreshed = await Skugr.findById(skugr._id).lean();
    expect(refreshed!.skus).toHaveLength(0);

    const still = await Sku.findById(existing._id).lean();
    expect(still!.prodName).toBe("acme");
  });

  it("non-newsku group promotes prodName from newsku and links", async () => {
    const existing = await Sku.create({
      konkName: "yumi",
      prodName: NEWSKU_PROD_NAME,
      productId: "yumi-502",
      title: "From novelties",
      url: "https://yumi.example/promote-me",
    });

    const skugr = await Skugr.create({
      konkName: "yumi",
      prodName: "acme",
      title: "Real group",
      url: "https://yumi.example/acme-group",
      skus: [],
    });

    mockFetch.mockResolvedValue([
      {
        title: "Parsed",
        url: "https://yumi.example/promote-me",
        imageUrl: "",
        productId: "502",
      },
    ]);

    const result = await fillSkugrSkusFromBrowserUtil(skugr._id.toString());
    expect(result!.stats.promotedFromNewsku).toBe(1);
    expect(result!.stats.linkedExisting).toBe(1);

    const promoted = await Sku.findById(existing._id).lean();
    expect(promoted!.prodName).toBe("acme");

    const refreshed = await Skugr.findById(skugr._id).lean();
    expect(refreshed!.skus.map(String)).toContain(existing._id.toString());
  });
});
