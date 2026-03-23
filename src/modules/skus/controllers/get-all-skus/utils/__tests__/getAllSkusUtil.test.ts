import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../models/Sku.js";
import { getAllSkusUtil } from "../getAllSkusUtil.js";

describe("getAllSkusUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
  });

  it("returns paginated skus", async () => {
    await Sku.create({
      konkName: "k1",
      prodName: "p1",
      productId: "k1-9",
      title: "S1",
      url: "https://k1.com/s1",
    });
    await Sku.create({
      konkName: "k1",
      prodName: "p2",
      productId: "k1-10",
      title: "S2",
      url: "https://k1.com/s2",
    });

    const result = await getAllSkusUtil({ page: 1, limit: 1 });
    expect(result.skus).toHaveLength(1);
    expect(result.pagination.total).toBe(2);
    expect(result.pagination.totalPages).toBe(2);
    expect(result.pagination.hasNext).toBe(true);
    expect(result.pagination.hasPrev).toBe(false);
  });

  it("applies filters by konkName and prodName", async () => {
    await Sku.create({
      konkName: "k-filter",
      prodName: "p-filter",
      productId: "k-filter-1",
      title: "Wanted",
      url: "https://k-filter.com/wanted",
    });
    await Sku.create({
      konkName: "k-other",
      prodName: "p-other",
      productId: "k-other-1",
      title: "Other",
      url: "https://k-other.com/other",
    });

    const result = await getAllSkusUtil({
      page: 1,
      limit: 10,
      konkName: "k-filter",
      prodName: "p-filter",
    });

    expect(result.skus).toHaveLength(1);
    expect(result.skus[0].title).toBe("Wanted");
    expect(result.pagination.total).toBe(1);
  });

  it("applies search by title substring (case-insensitive)", async () => {
    await Sku.create({
      konkName: "k1",
      prodName: "p1",
      productId: "k1-a",
      title: "Alpha Widget",
      url: "https://k1.com/a",
    });
    await Sku.create({
      konkName: "k1",
      prodName: "p1",
      productId: "k1-b",
      title: "Beta Gadget",
      url: "https://k1.com/b",
    });

    const result = await getAllSkusUtil({
      page: 1,
      limit: 10,
      search: "widget",
    });

    expect(result.skus).toHaveLength(1);
    expect(result.skus[0].title).toBe("Alpha Widget");
    expect(result.pagination.total).toBe(1);
  });

  it("combines search with konkName and prodName", async () => {
    await Sku.create({
      konkName: "k-x",
      prodName: "p-x",
      productId: "k-x-1",
      title: "Match Here",
      url: "https://kx.com/1",
    });
    await Sku.create({
      konkName: "k-y",
      prodName: "p-y",
      productId: "k-y-1",
      title: "Match There",
      url: "https://ky.com/1",
    });

    const result = await getAllSkusUtil({
      page: 1,
      limit: 10,
      konkName: "k-x",
      prodName: "p-x",
      search: "match",
    });

    expect(result.skus).toHaveLength(1);
    expect(result.skus[0].title).toBe("Match Here");
  });
});
