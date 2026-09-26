import { beforeEach, describe, expect, it } from "vitest";
import { NEWSKU_PROD_NAME } from "../../../../../skus/constants/newskuProdName.js";
import { Sku } from "../../../../../skus/models/Sku.js";
import { Skugr } from "../../../../models/Skugr.js";
import { purgePromotedFromNewskuUtil } from "../purgePromotedFromNewskuUtil.js";

describe("purgePromotedFromNewskuUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await Skugr.deleteMany({});
  });

  it("removes promoted skus from newsku group, keeps newsku ones", async () => {
    const kept = await Sku.create({
      konkName: "yumi",
      prodName: NEWSKU_PROD_NAME,
      productId: "yumi-keep",
      title: "Still new",
      url: "https://yumi.example/keep",
    });
    const promoted = await Sku.create({
      konkName: "yumi",
      prodName: "acme",
      productId: "yumi-promoted",
      title: "Already branded",
      url: "https://yumi.example/promoted",
    });
    const group = await Skugr.create({
      konkName: "yumi",
      prodName: NEWSKU_PROD_NAME,
      title: "Novinky",
      url: "https://yumi.example/new",
      skus: [kept._id, promoted._id],
    });
    await Skugr.create({
      konkName: "yumi",
      prodName: "acme",
      title: "Real brand group",
      url: "https://yumi.example/acme",
      skus: [promoted._id],
    });

    const result = await purgePromotedFromNewskuUtil();

    expect(result).toEqual({
      groupsTotal: 1,
      groupsModified: 1,
      uniqueSkusRemoved: 1,
      linksRemoved: 1,
    });

    const refreshed = await Skugr.findById(group._id).lean();
    expect(refreshed!.skus.map(String)).toEqual([kept._id.toString()]);

    const stillPromoted = await Sku.findById(promoted._id).lean();
    expect(stillPromoted!.prodName).toBe("acme");
  });

  it("counts links across multiple newsku groups for same promoted sku", async () => {
    const promoted = await Sku.create({
      konkName: "yumi",
      prodName: "acme",
      productId: "yumi-dup",
      title: "Dup",
      url: "https://yumi.example/dup",
    });
    await Skugr.create({
      konkName: "yumi",
      prodName: NEWSKU_PROD_NAME,
      title: "New A",
      url: "https://yumi.example/new-a",
      skus: [promoted._id],
    });
    await Skugr.create({
      konkName: "yumi",
      prodName: NEWSKU_PROD_NAME,
      title: "New B",
      url: "https://yumi.example/new-b",
      skus: [promoted._id],
    });

    const result = await purgePromotedFromNewskuUtil();

    expect(result.groupsTotal).toBe(2);
    expect(result.groupsModified).toBe(2);
    expect(result.uniqueSkusRemoved).toBe(1);
    expect(result.linksRemoved).toBe(2);

    const groups = await Skugr.find({ prodName: NEWSKU_PROD_NAME }).lean();
    expect(groups.every((g) => g.skus.length === 0)).toBe(true);
  });

  it("no-op when all linked skus still have newsku prodName", async () => {
    const sku = await Sku.create({
      konkName: "yumi",
      prodName: NEWSKU_PROD_NAME,
      productId: "yumi-only",
      title: "Only new",
      url: "https://yumi.example/only",
    });
    const group = await Skugr.create({
      konkName: "yumi",
      prodName: NEWSKU_PROD_NAME,
      title: "Novinky",
      url: "https://yumi.example/new-only",
      skus: [sku._id],
    });

    const result = await purgePromotedFromNewskuUtil();

    expect(result).toEqual({
      groupsTotal: 1,
      groupsModified: 0,
      uniqueSkusRemoved: 0,
      linksRemoved: 0,
    });

    const refreshed = await Skugr.findById(group._id).lean();
    expect(refreshed!.skus.map(String)).toEqual([sku._id.toString()]);
  });

  it("returns zeros when no newsku groups exist", async () => {
    await Skugr.create({
      konkName: "yumi",
      prodName: "acme",
      title: "Not new",
      url: "https://yumi.example/not-new",
      skus: [],
    });

    const result = await purgePromotedFromNewskuUtil();

    expect(result).toEqual({
      groupsTotal: 0,
      groupsModified: 0,
      uniqueSkusRemoved: 0,
      linksRemoved: 0,
    });
  });
});
