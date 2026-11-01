import { Types } from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { Skugr } from "../../../skugrs/models/Skugr.js";
import { Sku } from "../../../skus/models/Sku.js";
import { dedupeSkuIdsPreserveOrder, resolveSkusByIds } from "../resolveSkusByIds.js";

async function createSku(opts: {
  konkName: string;
  prodName: string;
  productId: string;
  title?: string;
}): Promise<Types.ObjectId> {
  const doc = await Sku.create({
    konkName: opts.konkName,
    prodName: opts.prodName,
    productId: opts.productId,
    title: opts.title ?? `T-${opts.productId}`,
    url: `https://e.com/${opts.konkName}/${opts.productId}`,
  });
  return doc._id;
}

describe("dedupeSkuIdsPreserveOrder", () => {
  it("dedupes preserving first occurrence and trims", () => {
    expect(dedupeSkuIdsPreserveOrder([" a ", "b", "a", " b ", ""])).toEqual(["a", "b"]);
  });
});

describe("resolveSkusByIds", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await Skugr.deleteMany({});
  });

  it("returns empty when no ids or none found", async () => {
    expect(await resolveSkusByIds([])).toEqual([]);
    expect(await resolveSkusByIds([new Types.ObjectId().toString()])).toEqual([]);
  });

  it("preserves request order after dedupe and skips missing ids", async () => {
    const a = await createSku({ konkName: "air", prodName: "g", productId: "air-a" });
    const b = await createSku({ konkName: "balun", prodName: "g", productId: "balun-b" });
    const missing = new Types.ObjectId().toString();

    const rows = await resolveSkusByIds([
      b.toString(),
      a.toString(),
      b.toString(),
      missing,
      a.toString(),
    ]);

    expect(rows.map((r) => r.productId)).toEqual(["balun-b", "air-a"]);
    expect(rows.map((r) => r.konkName)).toEqual(["balun", "air"]);
  });

  it("attaches first matching skugr by _id across competitors", async () => {
    const airSku = await createSku({ konkName: "air", prodName: "g", productId: "air-1" });
    const balunSku = await createSku({
      konkName: "balun",
      prodName: "g",
      productId: "balun-1",
    });

    const g1 = await Skugr.create({
      konkName: "air",
      prodName: "g",
      title: "Air Group",
      url: "https://e.com/skugr-air",
      isSliced: true,
      skus: [airSku],
    });
    await Skugr.create({
      konkName: "air",
      prodName: "g",
      title: "Air Group 2",
      url: "https://e.com/skugr-air-2",
      isSliced: true,
      skus: [airSku],
    });
    await Skugr.create({
      konkName: "balun",
      prodName: "g",
      title: "Balun Group",
      url: "https://e.com/skugr-balun",
      isSliced: true,
      skus: [balunSku],
    });

    const rows = await resolveSkusByIds([airSku.toString(), balunSku.toString()]);
    expect(rows).toHaveLength(2);
    expect(rows[0]!.skugrId).toBe(g1._id.toString());
    expect(rows[0]!.skugrTitle).toBe("Air Group");
    expect(rows[1]!.skugrTitle).toBe("Balun Group");
  });

  it("skips SKU without productId", async () => {
    const withPid = await createSku({
      konkName: "air",
      prodName: "g",
      productId: "air-ok",
    });
    const emptyPid = await Sku.create({
      konkName: "air",
      prodName: "g",
      productId: "   ",
      title: "Empty",
      url: "https://e.com/empty",
    });

    const rows = await resolveSkusByIds([emptyPid._id.toString(), withPid.toString()]);
    expect(rows.map((r) => r.productId)).toEqual(["air-ok"]);
  });
});
