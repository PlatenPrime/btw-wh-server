import { beforeEach, describe, expect, it } from "vitest";
import { GraboSku } from "../../../../models/GraboSku.js";
import { getAllGraboSkusUtil } from "../getAllGraboSkusUtil.js";

function graboSkuDoc(overrides: Record<string, unknown> = {}) {
  const productId = (overrides.productId as string) ?? "G00001";
  return {
    title: "Title",
    productId,
    url: `https://www.grabo-balloons.com/en/${productId.toLowerCase()}`,
    lastSeenAt: new Date("2026-08-15T00:00:00.000Z"),
    ...overrides,
  };
}

describe("getAllGraboSkusUtil", () => {
  beforeEach(async () => {
    await GraboSku.deleteMany({});
  });

  it("returns empty page when collection is empty", async () => {
    const result = await getAllGraboSkusUtil({
      page: 1,
      limit: 10,
      includeFilterOptions: false,
    });
    expect(result.graboSkus).toEqual([]);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });
  });

  it("paginates sorted by productId and omits filterOptions by default", async () => {
    await GraboSku.create(graboSkuDoc({ productId: "G2", title: "Second" }));
    await GraboSku.create(graboSkuDoc({ productId: "G1", title: "First" }));
    await GraboSku.create(graboSkuDoc({ productId: "G3", title: "Third" }));

    const firstPage = await getAllGraboSkusUtil({
      page: 1,
      limit: 2,
      includeFilterOptions: false,
    });

    expect(firstPage.graboSkus.map((doc) => doc.productId)).toEqual(["G1", "G2"]);
    expect(firstPage.graboSkus[0]).not.toHaveProperty("__v");
    expect(firstPage.pagination).toEqual({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
      hasNext: true,
      hasPrev: false,
    });
    expect(firstPage.filterOptions).toBeUndefined();

    const secondPage = await getAllGraboSkusUtil({
      page: 2,
      limit: 2,
      includeFilterOptions: false,
    });
    expect(secondPage.graboSkus.map((doc) => doc.productId)).toEqual(["G3"]);
    expect(secondPage.pagination.hasNext).toBe(false);
    expect(secondPage.pagination.hasPrev).toBe(true);
  });

  it("filters by exact productId", async () => {
    await GraboSku.create(graboSkuDoc({ productId: "G1" }));
    await GraboSku.create(graboSkuDoc({ productId: "G2" }));

    const result = await getAllGraboSkusUtil({
      page: 1,
      limit: 10,
      includeFilterOptions: false,
      productId: "G2",
    });

    expect(result.graboSkus).toHaveLength(1);
    expect(result.graboSkus[0]!.productId).toBe("G2");
  });

  it("searches title and productId case-insensitively", async () => {
    await GraboSku.create(
      graboSkuDoc({ productId: "G72274", title: "Pink Ribbon" })
    );
    await GraboSku.create(
      graboSkuDoc({ productId: "G10000", title: "Blue Star" })
    );

    const byTitle = await getAllGraboSkusUtil({
      page: 1,
      limit: 10,
      includeFilterOptions: false,
      search: "ribbon",
    });
    expect(byTitle.graboSkus).toHaveLength(1);
    expect(byTitle.graboSkus[0]!.productId).toBe("G72274");

    const byProductId = await getAllGraboSkusUtil({
      page: 1,
      limit: 10,
      includeFilterOptions: false,
      search: "g10000",
    });
    expect(byProductId.graboSkus).toHaveLength(1);
    expect(byProductId.graboSkus[0]!.title).toBe("Blue Star");
  });

  it("escapes search regex metacharacters", async () => {
    await GraboSku.create(graboSkuDoc({ productId: "GX1", title: "No" }));
    await GraboSku.create(graboSkuDoc({ productId: "G.1", title: "Yes" }));

    const result = await getAllGraboSkusUtil({
      page: 1,
      limit: 10,
      includeFilterOptions: false,
      search: "G.1",
    });

    expect(result.graboSkus).toHaveLength(1);
    expect(result.graboSkus[0]!.productId).toBe("G.1");
  });

  it("filters isOnSite, tag contains and exact attributes", async () => {
    await GraboSku.create(
      graboSkuDoc({
        productId: "G-ON",
        isOnSite: true,
        isNewProduct: true,
        color: "Pink",
        material: "Foil",
        gas: "Helium",
        language: "EN",
        gasCapacity: "air only",
        tags: ["birthday", "gold"],
      })
    );
    await GraboSku.create(
      graboSkuDoc({
        productId: "G-OFF",
        isOnSite: false,
        isNewProduct: false,
        color: "Blue",
        gasCapacity: "helium 0.02 m3",
        tags: ["other"],
      })
    );

    const result = await getAllGraboSkusUtil({
      page: 1,
      limit: 10,
      includeFilterOptions: false,
      isOnSite: true,
      isNewProduct: true,
      color: "Pink",
      material: "Foil",
      gas: "Helium",
      language: "EN",
      gasCapacity: "air only",
      tag: "birthday",
    });

    expect(result.graboSkus).toHaveLength(1);
    expect(result.graboSkus[0]!.productId).toBe("G-ON");
  });

  it("filters size by option prefix and does not match a longer inch value", async () => {
    await GraboSku.create(
      graboSkuDoc({
        productId: "G40A",
        size: '40" / 62x91x25 cm',
      })
    );
    await GraboSku.create(
      graboSkuDoc({
        productId: "G40B",
        size: '40" / other',
      })
    );
    await GraboSku.create(
      graboSkuDoc({
        productId: "G400",
        size: '400" / huge',
      })
    );
    await GraboSku.create(
      graboSkuDoc({
        productId: "G14",
        size: '14"',
      })
    );

    const result = await getAllGraboSkusUtil({
      page: 1,
      limit: 10,
      includeFilterOptions: false,
      size: '40"',
    });

    expect(result.graboSkus.map((doc) => doc.productId).sort()).toEqual([
      "G40A",
      "G40B",
    ]);
  });

  it("includes filterOptions from the whole collection, not the current page", async () => {
    await GraboSku.create(
      graboSkuDoc({
        productId: "G1",
        color: "Pink",
        size: '14" / a',
        gasCapacity: "air only",
        tags: ["Party"],
      })
    );
    await GraboSku.create(
      graboSkuDoc({
        productId: "G2",
        color: "Blue",
        size: '18" / b',
        gasCapacity: "helium 0.02 m3",
        tags: ["Girl", "Party"],
      })
    );
    await GraboSku.create(
      graboSkuDoc({
        productId: "G3",
        color: "Gold",
        size: '14" / c',
        gasCapacity: "",
        tags: [],
      })
    );

    const result = await getAllGraboSkusUtil({
      page: 1,
      limit: 1,
      includeFilterOptions: true,
      color: "Pink",
    });

    expect(result.graboSkus).toHaveLength(1);
    expect(result.graboSkus[0]!.productId).toBe("G1");
    expect(result.filterOptions?.color).toEqual(["Blue", "Gold", "Pink"]);
    expect(result.filterOptions?.size).toEqual(['14"', '18"']);
    expect(result.filterOptions?.gasCapacity).toEqual([
      "air only",
      "helium 0.02 m3",
    ]);
    expect(result.filterOptions?.tags).toEqual(["Girl", "Party"]);
  });
});
