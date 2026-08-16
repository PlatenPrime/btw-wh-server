import { describe, expect, it } from "vitest";
import { getAllGraboSkusQuerySchema } from "../getAllGraboSkusQuerySchema.js";

describe("getAllGraboSkusQuerySchema", () => {
  it("applies defaults for page, limit and includeFilterOptions", () => {
    const result = getAllGraboSkusQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.page).toBe(1);
    expect(result.data.limit).toBe(10);
    expect(result.data.includeFilterOptions).toBe(false);
    expect(result.data.isOnSite).toBeUndefined();
    expect(result.data.isNewProduct).toBeUndefined();
  });

  it("transforms boolean query strings", () => {
    const result = getAllGraboSkusQuerySchema.safeParse({
      isOnSite: "true",
      isNewProduct: "false",
      includeFilterOptions: "true",
      page: "2",
      limit: "25",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.isOnSite).toBe(true);
    expect(result.data.isNewProduct).toBe(false);
    expect(result.data.includeFilterOptions).toBe(true);
    expect(result.data.page).toBe(2);
    expect(result.data.limit).toBe(25);
  });

  it("treats includeFilterOptions false as false", () => {
    const result = getAllGraboSkusQuerySchema.safeParse({
      includeFilterOptions: "false",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.includeFilterOptions).toBe(false);
  });

  it("keeps optional filter strings", () => {
    const result = getAllGraboSkusQuerySchema.safeParse({
      search: "ribbon",
      productId: "G1",
      color: "Pink",
      size: '40"',
      material: "Foil",
      gas: "Helium",
      language: "EN",
      gasCapacity: "air only",
      tag: "birthday",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.search).toBe("ribbon");
    expect(result.data.productId).toBe("G1");
    expect(result.data.color).toBe("Pink");
    expect(result.data.size).toBe('40"');
    expect(result.data.material).toBe("Foil");
    expect(result.data.gas).toBe("Helium");
    expect(result.data.language).toBe("EN");
    expect(result.data.gasCapacity).toBe("air only");
    expect(result.data.tag).toBe("birthday");
  });

  it("rejects non-positive page and limit above 100", () => {
    expect(
      getAllGraboSkusQuerySchema.safeParse({ page: "0" }).success
    ).toBe(false);
    expect(
      getAllGraboSkusQuerySchema.safeParse({ page: "-1" }).success
    ).toBe(false);
    expect(
      getAllGraboSkusQuerySchema.safeParse({ limit: "101" }).success
    ).toBe(false);
    expect(
      getAllGraboSkusQuerySchema.safeParse({ limit: "0" }).success
    ).toBe(false);
  });

  it("rejects invalid boolean literals", () => {
    expect(
      getAllGraboSkusQuerySchema.safeParse({ isOnSite: "yes" }).success
    ).toBe(false);
    expect(
      getAllGraboSkusQuerySchema.safeParse({ includeFilterOptions: "1" })
        .success
    ).toBe(false);
  });
});
