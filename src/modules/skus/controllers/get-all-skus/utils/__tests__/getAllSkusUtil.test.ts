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
      title: "S1",
      url: "https://k1.com/s1",
    });
    await Sku.create({
      konkName: "k1",
      prodName: "p2",
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
      title: "Wanted",
      url: "https://k-filter.com/wanted",
    });
    await Sku.create({
      konkName: "k-other",
      prodName: "p-other",
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
});
