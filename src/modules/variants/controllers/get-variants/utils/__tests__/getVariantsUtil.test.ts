import { beforeEach, describe, expect, it } from "vitest";
import { Variant } from "../../../../models/Variant.js";
import { getVariantsUtil } from "../getVariantsUtil.js";

describe("getVariantsUtil", () => {
  beforeEach(async () => {
    await Variant.deleteMany({});
  });

  it("returns paginated variants and pagination info", async () => {
    await Variant.create([
      {
        konkName: "k1",
        prodName: "p1",
        title: "B",
        url: "https://a.com",
        imageUrl: "https://example.com/a.png",
      },
      {
        konkName: "k1",
        prodName: "p1",
        title: "A",
        url: "https://b.com",
        imageUrl: "https://example.com/b.png",
      },
      {
        konkName: "k2",
        prodName: "p1",
        title: "C",
        url: "https://c.com",
        imageUrl: "https://example.com/c.png",
      },
    ]);

    const result = await getVariantsUtil({ page: 1, limit: 2 });
    expect(result.variants).toHaveLength(2);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
      hasNext: true,
      hasPrev: false,
    });
  });

  it("filters by konkName when provided", async () => {
    await Variant.create([
      {
        konkName: "acme",
        prodName: "p",
        title: "T1",
        url: "https://a.com",
        imageUrl: "https://example.com/a.png",
      },
      {
        konkName: "other",
        prodName: "p",
        title: "T2",
        url: "https://b.com",
        imageUrl: "https://example.com/b.png",
      },
    ]);

    const result = await getVariantsUtil({
      konkName: "acme",
      page: 1,
      limit: 10,
    });

    expect(result.variants).toHaveLength(1);
    expect(result.variants[0].konkName).toBe("acme");
    expect(result.pagination.total).toBe(1);
  });

  it("filters by prodName when provided", async () => {
    await Variant.create([
      {
        konkName: "k",
        prodName: "maker",
        title: "T1",
        url: "https://a.com",
        imageUrl: "https://example.com/a.png",
      },
      {
        konkName: "k",
        prodName: "other",
        title: "T2",
        url: "https://b.com",
        imageUrl: "https://example.com/b.png",
      },
    ]);

    const result = await getVariantsUtil({
      prodName: "maker",
      page: 1,
      limit: 10,
    });

    expect(result.variants).toHaveLength(1);
    expect(result.variants[0].prodName).toBe("maker");
  });

  it("filters by search (title) when provided", async () => {
    await Variant.create([
      {
        konkName: "k",
        prodName: "p",
        title: "Товар один",
        url: "https://a.com",
        imageUrl: "https://example.com/a.png",
      },
      {
        konkName: "k",
        prodName: "p",
        title: "Other",
        url: "https://b.com",
        imageUrl: "https://example.com/b.png",
      },
    ]);

    const result = await getVariantsUtil({
      page: 1,
      limit: 10,
      search: "Товар",
    });

    expect(result.variants).toHaveLength(1);
    expect(result.variants[0].title).toBe("Товар один");
  });

  it("returns variants sorted by title", async () => {
    await Variant.create([
      {
        konkName: "k",
        prodName: "p",
        title: "C",
        url: "https://c.com",
        imageUrl: "https://example.com/c.png",
      },
      {
        konkName: "k",
        prodName: "p",
        title: "A",
        url: "https://a.com",
        imageUrl: "https://example.com/a.png",
      },
      {
        konkName: "k",
        prodName: "p",
        title: "B",
        url: "https://b.com",
        imageUrl: "https://example.com/b.png",
      },
    ]);

    const result = await getVariantsUtil({ page: 1, limit: 10 });
    expect(result.variants.map((v) => v.title)).toEqual(["A", "B", "C"]);
  });
});

