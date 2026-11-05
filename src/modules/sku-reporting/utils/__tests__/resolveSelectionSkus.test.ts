import { Types } from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../skus/models/Sku.js";
import { resolveSelectionSkus } from "../resolveSelectionSkus.js";

async function createSku(opts: {
  konkName: string;
  prodName: string;
  productId: string;
  title: string;
  imageUrl?: string;
}): Promise<Types.ObjectId> {
  const doc = await Sku.create({
    konkName: opts.konkName,
    prodName: opts.prodName,
    productId: opts.productId,
    title: opts.title,
    url: `https://e.com/${opts.productId}`,
    imageUrl: opts.imageUrl ?? "",
  });
  return doc._id;
}

describe("resolveSelectionSkus", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
  });

  it("resolves by skuIds preserving order", async () => {
    const b = await createSku({
      konkName: "air",
      prodName: "g",
      productId: "b",
      title: "B",
    });
    const a = await createSku({
      konkName: "air",
      prodName: "g",
      productId: "a",
      title: "A",
    });

    const rows = await resolveSelectionSkus({ skuIds: [b.toString(), a.toString()] });
    expect(rows.map((r) => r.productId)).toEqual(["b", "a"]);
  });

  it("selectAll uses catalog filters and title sort", async () => {
    await createSku({
      konkName: "ivvo",
      prodName: "APT",
      productId: "2",
      title: "Zebra",
      imageUrl: "https://cdn.example/z.jpg",
    });
    await createSku({
      konkName: "ivvo",
      prodName: "APT",
      productId: "1",
      title: "Apple",
      imageUrl: "https://cdn.example/a.jpg",
    });
    await createSku({
      konkName: "other",
      prodName: "APT",
      productId: "3",
      title: "Middle",
    });

    const rows = await resolveSelectionSkus({
      selectAll: true,
      konkName: "ivvo",
      prodName: "APT",
    });
    expect(rows.map((r) => r.title)).toEqual(["Apple", "Zebra"]);
    expect(rows[0]!.imageUrl).toBe("https://cdn.example/a.jpg");
  });

  it("selectAll with search returns matches only", async () => {
    await createSku({
      konkName: "air",
      prodName: "g",
      productId: "1",
      title: "Happy Birthday",
    });
    await createSku({
      konkName: "air",
      prodName: "g",
      productId: "2",
      title: "Other",
    });

    const rows = await resolveSelectionSkus({
      selectAll: true,
      search: "Happy",
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.title).toBe("Happy Birthday");
  });
});
